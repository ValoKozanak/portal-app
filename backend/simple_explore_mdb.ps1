# Simple PowerShell script to explore POHODA Access database
$dbPath = "C:\Users\kozan\Cursor\backend\zalohy\extracted\PohodaXX.mdb"

Write-Host "Exploring POHODA Access database: $dbPath"

if (Test-Path $dbPath) {
    Write-Host "File exists!"
    
    try {
        # Use DAO (Data Access Objects) via COM
        $dao = New-Object -ComObject DAO.DBEngine.36
        $database = $dao.OpenDatabase($dbPath)
        
        Write-Host "Connected to database!"
        
        # Get list of tables
        Write-Host "`nTables found:"
        $tables = @()
        
        foreach ($tableDef in $database.TableDefs) {
            $tableName = $tableDef.Name
            if ($tableName -notlike "MSys*" -and $tableName -notlike "~*") {
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
            
            $tableDef = $database.TableDefs($firstTable)
            
            # Table structure
            Write-Host "Table structure:"
            foreach ($field in $tableDef.Fields) {
                $fieldName = $field.Name
                $fieldType = $field.Type
                $fieldSize = $field.Size
                Write-Host "  - $fieldName (Type: $fieldType, Size: $fieldSize)"
            }
            
            # First 5 rows
            Write-Host ""
            Write-Host "First 5 rows from table $firstTable"
            $recordset = $database.OpenRecordset("SELECT TOP 5 * FROM [$firstTable]")
            
            $rowCount = 0
            while (-not $recordset.EOF -and $rowCount -lt 5) {
                $row = @()
                foreach ($field in $recordset.Fields) {
                    $value = $field.Value
                    if ($value -eq $null) { $value = "NULL" }
                    $row += "$($field.Name): $value"
                }
                $rowText = $row -join " | "
                Write-Host "Row $($rowCount + 1): $rowText"
                $rowCount++
                $recordset.MoveNext()
            }
            $recordset.Close()
        }
        
        # Look for company/partner tables
        Write-Host "`nLooking for company tables..."
        $companyTables = $tables | Where-Object { $_ -match "firma|partner|company|adresar|kontakt" }
        
        if ($companyTables.Count -gt 0) {
            Write-Host "Found company tables:"
            $companyTables | ForEach-Object { Write-Host "  - $_" }
        }
        
        $database.Close()
        $dao = $null
        
        Write-Host "`nExploration completed!"
        
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
    }
} else {
    Write-Host "File not found!"
}
