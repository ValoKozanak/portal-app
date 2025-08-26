# PowerShell script to explore POHODA Access database using ADO.NET
$dbPath = "C:\Users\kozan\Cursor\backend\zalohy\extracted\PohodaXX.mdb"

Write-Host "Exploring POHODA Access database: $dbPath"

if (Test-Path $dbPath) {
    Write-Host "File exists!"
    
    try {
        # Use ADO.NET with ACE provider
        $connectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$dbPath;"
        $connection = New-Object System.Data.OleDb.OleDbConnection($connectionString)
        $connection.Open()
        
        Write-Host "Connected to database!"
        
        # Get schema information
        $schema = $connection.GetSchema("Tables")
        
        Write-Host "`nTables found:"
        $tables = @()
        
        foreach ($row in $schema.Rows) {
            $tableName = $row["TABLE_NAME"]
            $tableType = $row["TABLE_TYPE"]
            
            if ($tableType -eq "TABLE" -and $tableName -notlike "MSys*" -and $tableName -notlike "~*") {
                $tables += $tableName
                Write-Host "- $tableName"
            }
        }
        
        Write-Host "`nTotal tables: $($tables.Count)"
        
        # Look for invoice-related tables
        Write-Host "`nLooking for invoice-related tables..."
        $invoiceTables = $tables | Where-Object { $_ -match "fakt|invoice|doklad|vydan|faktur" }
        
        if ($invoiceTables.Count -gt 0) {
            Write-Host "Found invoice tables:"
            $invoiceTables | ForEach-Object { Write-Host "  - $_" }
            
            # Explore first invoice table
            $firstTable = $invoiceTables[0]
            Write-Host "`nExploring table: $firstTable"
            
            # Get table structure
            $command = $connection.CreateCommand()
            $command.CommandText = "SELECT * FROM [$firstTable] WHERE 1=0"
            $reader = $command.ExecuteReader()
            
            Write-Host "Table structure:"
            for ($i = 0; $i -lt $reader.FieldCount; $i++) {
                $fieldName = $reader.GetName($i)
                $fieldType = $reader.GetDataTypeName($i)
                Write-Host "  - $fieldName ($fieldType)"
            }
            $reader.Close()
            
            # Get first 5 rows
            Write-Host "`nFirst 5 rows from table $firstTable"
            $command.CommandText = "SELECT TOP 5 * FROM [$firstTable]"
            $reader = $command.ExecuteReader()
            
            $rowCount = 0
            while ($reader.Read() -and $rowCount -lt 5) {
                $row = @()
                for ($i = 0; $i -lt $reader.FieldCount; $i++) {
                    $fieldName = $reader.GetName($i)
                    $value = $reader.GetValue($i)
                    if ($value -eq $null) { $value = "NULL" }
                    $row += "$fieldName $value"
                }
                $rowText = $row -join " | "
                Write-Host "Row $($rowCount + 1): $rowText"
                $rowCount++
            }
            $reader.Close()
        }
        
        # Look for company/partner tables
        Write-Host "`nLooking for company tables..."
        $companyTables = $tables | Where-Object { $_ -match "firma|partner|company|adresar|kontakt" }
        
        if ($companyTables.Count -gt 0) {
            Write-Host "Found company tables:"
            $companyTables | ForEach-Object { Write-Host "  - $_" }
        }
        
        $connection.Close()
        
        Write-Host "`nExploration completed!"
        
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
    }
} else {
    Write-Host "File not found!"
}
