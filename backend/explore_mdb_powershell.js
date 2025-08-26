const { exec } = require('child_process');
const path = require('path');

const dbPath = path.join(__dirname, 'zalohy', 'extracted', 'PohodaXX.mdb');

console.log('🔍 Preskúmavam Access databázu cez PowerShell:', dbPath);

// PowerShell script na čítanie Access databázy
const psScript = `
$connectionString = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source='${dbPath.replace(/\\/g, '\\\\')}';"
$connection = New-Object System.Data.OleDb.OleDbConnection($connectionString)
$connection.Open()

# Získanie zoznamu tabuliek
$command = $connection.CreateCommand()
$command.CommandText = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"
$reader = $command.ExecuteReader()

Write-Host "📊 Nájdené tabuľky:"
$tables = @()
while ($reader.Read()) {
    $tableName = $reader["TABLE_NAME"]
    $tables += $tableName
    Write-Host "- $tableName"
}

$reader.Close()

# Hľadanie tabuliek s faktúrami
Write-Host ""
Write-Host "🔍 Hľadám tabuľky súvisiace s faktúrami..."
$invoiceTables = $tables | Where-Object { $_ -match "fakt|invoice|doklad|vydan" }

if ($invoiceTables.Count -gt 0) {
    Write-Host "💰 Nájdené tabuľky s faktúrami:"
    $invoiceTables | ForEach-Object { Write-Host "- $_" }
    
    # Preskúmanie prvej tabuľky s faktúrami
    $firstTable = $invoiceTables[0]
    Write-Host ""
    Write-Host "📋 Preskúmavam tabuľku: $firstTable"
    
    # Štruktúra tabuľky
    $command.CommandText = "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '$firstTable' ORDER BY ORDINAL_POSITION"
    $reader = $command.ExecuteReader()
    
    Write-Host "📊 Štruktúra tabuľky:"
    while ($reader.Read()) {
        $columnName = $reader["COLUMN_NAME"]
        $dataType = $reader["DATA_TYPE"]
        Write-Host "  - $columnName ($dataType)"
    }
    $reader.Close()
    
    # Prvých 5 riadkov
    $command.CommandText = "SELECT TOP 5 * FROM [$firstTable]"
    $reader = $command.ExecuteReader()
    
    Write-Host ""
    Write-Host "📄 Prvých 5 riadkov z tabuľky $firstTable:"
    $columns = @()
    for ($i = 0; $i -lt $reader.FieldCount; $i++) {
        $columns += $reader.GetName($i)
    }
    Write-Host "Stĺpce: $($columns -join ', ')"
    
    while ($reader.Read()) {
        $row = @()
        for ($i = 0; $i -lt $reader.FieldCount; $i++) {
            $value = $reader.GetValue($i)
            if ($value -eq $null) { $value = "NULL" }
            $row += "$($columns[$i]): $value"
        }
        Write-Host "Riadok: $($row -join ' | ')"
    }
    $reader.Close()
}

$connection.Close()
`;

// Spustenie PowerShell scriptu
exec(`powershell -Command "${psScript}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Chyba pri spustení PowerShell scriptu:', error);
    return;
  }
  
  if (stderr) {
    console.error('⚠️ PowerShell stderr:', stderr);
  }
  
  console.log('✅ Výstup z PowerShell:');
  console.log(stdout);
});
