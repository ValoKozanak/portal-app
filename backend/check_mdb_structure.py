import pyodbc
import os

# Cesta k MDB súboru
mdb_path = r"C:\Users\kozan\Cursor\backend\zalohy\2025\36255789_2025\PohodaXX.mdb"

try:
    # Pripojenie k MDB
    conn_str = f"Driver={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={mdb_path};"
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    # Získanie informácií o stĺpcoch tabuľky FA
    columns = cursor.columns(table='FA')
    
    print("Stĺpce v tabuľke FA:")
    print("-" * 50)
    for column in columns:
        print(f"Stĺpec: {column.column_name}")
        print(f"  Typ: {column.type_name}")
        print(f"  Veľkosť: {column.column_size}")
        print(f"  Nullable: {column.nullable}")
        print()
    
    # Získanie príkladu dát
    cursor.execute("SELECT TOP 1 * FROM FA WHERE RelTpFak = 11")
    row = cursor.fetchone()
    
    if row:
        print("Príklad dát z FA tabuľky (RelTpFak = 11):")
        print("-" * 50)
        for i, value in enumerate(row):
            column_name = row.cursor_description[i][0]
            print(f"{column_name}: {value}")
    
    conn.close()
    
except Exception as e:
    print(f"Chyba: {e}")


