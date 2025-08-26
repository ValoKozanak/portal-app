import pyodbc
import os

# Cesta k MDB súboru pre firmu 11111111
mdb_path = r"C:\Users\kozan\Cursor\backend\zalohy\2025\11111111_2025\PohodaXX.mdb"

try:
    # Pripojenie k MDB
    conn_str = f"Driver={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={mdb_path};"
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    print("Kontrolujem faktúry v MDB pre firmu 11111111...")
    
    # Získanie počtu faktúr
    cursor.execute("SELECT COUNT(*) FROM FA")
    count = cursor.fetchone()[0]
    print(f"Celkový počet faktúr v tabuľke FA: {count}")
    
    # Získanie faktúr s RelTpFak = 11 (prijaté faktúry)
    cursor.execute("SELECT COUNT(*) FROM FA WHERE RelTpFak = 11")
    received_count = cursor.fetchone()[0]
    print(f"Počet prijatých faktúr (RelTpFak = 11): {received_count}")
    
    # Získanie faktúr s RelTpFak = 1 (vydané faktúry)
    cursor.execute("SELECT COUNT(*) FROM FA WHERE RelTpFak = 1")
    issued_count = cursor.fetchone()[0]
    print(f"Počet vydaných faktúr (RelTpFak = 1): {issued_count}")
    
    # Príklad faktúry
    if received_count > 0:
        cursor.execute("SELECT TOP 3 * FROM FA WHERE RelTpFak = 11")
        rows = cursor.fetchall()
        print("\nPríklad prijatých faktúr:")
        for i, row in enumerate(rows):
            print(f"Faktúra {i+1}:")
            print(f"  Cislo: {row.Cislo}")
            print(f"  Firma: {row.Firma}")
            print(f"  Datum: {row.Datum}")
            print(f"  KcCelkem: {row.KcCelkem}")
            print(f"  Kc0: {row.Kc0}")
            print(f"  Kc1: {row.Kc1}")
            print(f"  Kc2: {row.Kc2}")
            print(f"  Kc3: {row.Kc3}")
            print()
    
    conn.close()
    
except Exception as e:
    print(f"Chyba: {e}")


