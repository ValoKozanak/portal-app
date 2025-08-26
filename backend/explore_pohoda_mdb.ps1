# PowerShell script na preskúmanie POHODA Access databázy
$dbPath = "C:\Users\kozan\Cursor\backend\zalohy\extracted\PohodaXX.mdb"

Write-Host "🔍 Preskúmavam POHODA Access databázu: $dbPath"

if (Test-Path $dbPath) {
    Write-Host "✅ Súbor existuje!"
    
    try {
        # Použitie DAO (Data Access Objects) cez COM
        $dao = New-Object -ComObject DAO.DBEngine.36
        $database = $dao.OpenDatabase($dbPath)
        
        Write-Host "✅ Pripojenie k databáze úspešné!"
        
        # Získanie zoznamu tabuliek
        Write-Host "`n📊 Nájdené tabuľky:"
        $tables = @()
        
        foreach ($tableDef in $database.TableDefs) {
            $tableName = $tableDef.Name
            if ($tableName -notlike "MSys*" -and $tableName -notlike "~*") {
                $tables += $tableName
                Write-Host "- $tableName"
            }
        }
        
        Write-Host "`nCelkovo tabuliek: $($tables.Count)"
        
        # Hľadanie tabuliek súvisiacich s faktúrami
        Write-Host "`n🔍 Hľadám tabuľky súvisiace s faktúrami..."
        $invoiceTables = $tables | Where-Object { $_ -match "fakt|invoice|doklad|vydan|faktur" }
        
        if ($invoiceTables.Count -gt 0) {
            Write-Host "💰 Nájdené tabuľky s faktúrami:"
            $invoiceTables | ForEach-Object { Write-Host "  - $_" }
            
            # Preskúmanie prvej tabuľky s faktúrami
            $firstTable = $invoiceTables[0]
            Write-Host "`n📋 Preskúmavam tabuľku: $firstTable"
            
            $tableDef = $database.TableDefs($firstTable)
            
            # Štruktúra tabuľky
            Write-Host "📊 Štruktúra tabuľky:"
            foreach ($field in $tableDef.Fields) {
                $fieldName = $field.Name
                $fieldType = $field.Type
                $fieldSize = $field.Size
                Write-Host "  - $fieldName (Type: $fieldType, Size: $fieldSize)"
            }
            
            # Prvých 5 riadkov
            Write-Host "`n📄 Prvých 5 riadkov z tabuľky $firstTable:"
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
                Write-Host "Riadok $($rowCount + 1): $rowText"
                $rowCount++
                $recordset.MoveNext()
            }
            $recordset.Close()
        }
        
        # Hľadanie tabuliek s firmami/partnerami
        Write-Host "`n🏢 Hľadám tabuľky s firmami..."
        $companyTables = $tables | Where-Object { $_ -match "firma|partner|company|adresar|kontakt" }
        
        if ($companyTables.Count -gt 0) {
            Write-Host "🏢 Nájdené tabuľky s firmami:"
            $companyTables | ForEach-Object { Write-Host "  - $_" }
        }
        
        $database.Close()
        $dao = $null
        
        Write-Host "`n✅ Preskúmanie dokončené!"
        
    } catch {
        Write-Host "❌ Chyba: $($_.Exception.Message)"
        Write-Host "Stack trace: $($_.Exception.StackTrace)"
    }
} else {
    Write-Host "❌ Súbor nebol nájdený!"
}
