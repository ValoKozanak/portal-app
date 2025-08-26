# Test Access databázy
$dbPath = "C:\Users\kozan\Cursor\backend\zalohy\extracted\PohodaXX.mdb"

Write-Host "Testing Access database: $dbPath"

if (Test-Path $dbPath) {
    Write-Host "✅ File exists!"
    
    try {
        $connectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$dbPath;"
        $connection = New-Object System.Data.OleDb.OleDbConnection($connectionString)
        $connection.Open()
        
        Write-Host "✅ Connected to database!"
        
        # Try to read known POHODA tables
        $knownTables = @("VydFaktury", "Faktury", "Doklady", "Partneri", "Firmy", "Adresar")
        
        Write-Host "`nTesting known POHODA tables:"
        $foundTables = @()
        
        foreach ($table in $knownTables) {
            try {
                $command = $connection.CreateCommand()
                $command.CommandText = "SELECT TOP 1 * FROM [$table]"
                $reader = $command.ExecuteReader()
                $reader.Close()
                $foundTables += $table
                Write-Host "✅ Found table: $table"
            } catch {
                Write-Host "❌ Table not found: $table"
            }
        }
        
        Write-Host "`nFound tables: $($foundTables.Count)"
        
        # If we found tables, explore the first one
        if ($foundTables.Count -gt 0) {
            $firstTable = $foundTables[0]
            Write-Host "`nExploring table: $firstTable"
            
            try {
                $command = $connection.CreateCommand()
                $command.CommandText = "SELECT TOP 5 * FROM [$firstTable]"
                $reader = $command.ExecuteReader()
                
                # Get column names
                $columns = @()
                for ($i = 0; $i -lt $reader.FieldCount; $i++) {
                    $columns += $reader.GetName($i)
                }
                Write-Host "Columns: $($columns -join ', ')"
                
                # Read first few rows
                $rowCount = 0
                while ($reader.Read() -and $rowCount -lt 3) {
                    $row = @()
                    for ($i = 0; $i -lt $reader.FieldCount; $i++) {
                        $value = $reader.GetValue($i)
                        if ($value -eq $null) { $value = "NULL" }
                        $row += "$($columns[$i]): $value"
                    }
                    Write-Host "Row $($rowCount + 1): $($row -join ' | ')"
                    $rowCount++
                }
                $reader.Close()
            } catch {
                $errorMsg = $_.Exception.Message
                Write-Host "❌ Error reading table $firstTable: $errorMsg"
            }
        }
        
        $connection.Close()
        
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)"
    }
} else {
    Write-Host "❌ File not found!"
}
