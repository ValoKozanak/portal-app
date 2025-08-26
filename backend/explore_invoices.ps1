# PowerShell script to explore invoice tables in POHODA
$dbPath = "C:\Users\kozan\Cursor\backend\zalohy\extracted\PohodaXX.mdb"

Write-Host "Exploring invoice tables in POHODA database: $dbPath"

if (Test-Path $dbPath) {
    try {
        $connectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$dbPath;"
        $connection = New-Object System.Data.OleDb.OleDbConnection($connectionString)
        $connection.Open()
        
        Write-Host "Connected to database!"
        
        # Get schema information
        $schema = $connection.GetSchema("Tables")
        
        # Look for invoice-related tables
        $invoiceTables = @()
        foreach ($row in $schema.Rows) {
            $tableName = $row["TABLE_NAME"]
            $tableType = $row["TABLE_TYPE"]
            
            if ($tableType -eq "TABLE" -and $tableName -notlike "MSys*" -and $tableName -notlike "~*" -and $tableName -notlike "lg*" -and $tableName -notlike "t*") {
                if ($tableName -match "fakt|invoice|doklad|vydan|faktur|FA|PH|BV|BP|MZ|ZAM") {
                    $invoiceTables += $tableName
                }
            }
        }
        
        Write-Host "`nFound invoice-related tables:"
        $invoiceTables | ForEach-Object { Write-Host "  - $_" }
        
        # Explore each invoice table
        foreach ($tableName in $invoiceTables) {
            Write-Host "`n" + "="*50
            Write-Host "Exploring table: $tableName"
            Write-Host "="*50
            
            try {
                # Get table structure
                $command = $connection.CreateCommand()
                $command.CommandText = "SELECT * FROM [$tableName] WHERE 1=0"
                $reader = $command.ExecuteReader()
                
                Write-Host "Table structure:"
                for ($i = 0; $i -lt $reader.FieldCount; $i++) {
                    $fieldName = $reader.GetName($i)
                    $fieldType = $reader.GetDataTypeName($i)
                    Write-Host "  - $fieldName ($fieldType)"
                }
                $reader.Close()
                
                # Get row count
                $command.CommandText = "SELECT COUNT(*) as RowCount FROM [$tableName]"
                $reader = $command.ExecuteReader()
                $reader.Read()
                $rowCount = $reader["RowCount"]
                $reader.Close()
                
                Write-Host "Total rows: $rowCount"
                
                # Get first 3 rows if table has data
                if ($rowCount -gt 0) {
                    Write-Host "`nFirst 3 rows:"
                    $command.CommandText = "SELECT TOP 3 * FROM [$tableName]"
                    $reader = $command.ExecuteReader()
                    
                    $displayRowCount = 0
                    while ($reader.Read() -and $displayRowCount -lt 3) {
                        $row = @()
                        for ($i = 0; $i -lt $reader.FieldCount; $i++) {
                            $fieldName = $reader.GetName($i)
                            $value = $reader.GetValue($i)
                            if ($value -eq $null) { $value = "NULL" }
                            $row += "$fieldName $value"
                        }
                        $rowText = $row -join " | "
                        Write-Host "Row $($displayRowCount + 1): $rowText"
                        $displayRowCount++
                    }
                    $reader.Close()
                }
                
            } catch {
                $errorMsg = $_.Exception.Message
                Write-Host "Error reading table $tableName $errorMsg"
            }
        }
        
        $connection.Close()
        
        Write-Host "`nExploration completed!"
        
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
    }
} else {
    Write-Host "File not found!"
}
