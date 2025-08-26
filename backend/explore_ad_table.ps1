# PowerShell script to explore AD table (address book)
$dbPath = "C:\Users\kozan\Cursor\backend\zalohy\extracted\PohodaXX.mdb"

Write-Host "Exploring AD table (address book) in POHODA database: $dbPath"

if (Test-Path $dbPath) {
    try {
        $connectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$dbPath;"
        $connection = New-Object System.Data.OleDb.OleDbConnection($connectionString)
        $connection.Open()
        
        Write-Host "Connected to database!"
        
        # Explore AD table
        Write-Host "`nExploring AD table (address book):"
        
        # Get table structure
        $command = $connection.CreateCommand()
        $command.CommandText = "SELECT * FROM [AD] WHERE 1=0"
        $reader = $command.ExecuteReader()
        
        Write-Host "Table structure:"
        for ($i = 0; $i -lt $reader.FieldCount; $i++) {
            $fieldName = $reader.GetName($i)
            $fieldType = $reader.GetDataTypeName($i)
            Write-Host "  - $fieldName ($fieldType)"
        }
        $reader.Close()
        
        # Get row count
        $command.CommandText = "SELECT COUNT(*) as RowCount FROM [AD]"
        $reader = $command.ExecuteReader()
        $reader.Read()
        $rowCount = $reader["RowCount"]
        $reader.Close()
        
        Write-Host "Total rows: $rowCount"
        
        # Get first 10 rows if table has data
        if ($rowCount -gt 0) {
            Write-Host "`nFirst 10 rows:"
            $command.CommandText = "SELECT TOP 10 * FROM [AD]"
            $reader = $command.ExecuteReader()
            
            $displayRowCount = 0
            while ($reader.Read() -and $displayRowCount -lt 10) {
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
        
        # Also check ADcn table (contacts)
        Write-Host "`n" + "="*50
        Write-Host "Exploring ADcn table (contacts):"
        Write-Host "="*50
        
        $command.CommandText = "SELECT COUNT(*) as RowCount FROM [ADcn]"
        $reader = $command.ExecuteReader()
        $reader.Read()
        $rowCount = $reader["RowCount"]
        $reader.Close()
        
        Write-Host "ADcn total rows: $rowCount"
        
        if ($rowCount -gt 0) {
            $command.CommandText = "SELECT TOP 5 * FROM [ADcn]"
            $reader = $command.ExecuteReader()
            
            $displayRowCount = 0
            while ($reader.Read() -and $displayRowCount -lt 5) {
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
        
        $connection.Close()
        
        Write-Host "`nExploration completed!"
        
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
    }
} else {
    Write-Host "File not found!"
}

