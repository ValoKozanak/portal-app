#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import pyodbc
import os

def list_tables_from_mdb(mdb_path):
    """Zobrazí všetky tabuľky v MDB súbore"""
    
    if not os.path.exists(mdb_path):
        print(f"Error: MDB file not found: {mdb_path}")
        return
    
    try:
        # Pripojenie k MDB súboru
        conn_str = f"Driver={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={mdb_path};"
        conn = pyodbc.connect(conn_str)
        
        cursor = conn.cursor()
        
        # Získanie zoznamu tabuliek
        tables = [row.table_name for row in cursor.tables(tableType='TABLE')]
        
        print(f"Tables in {mdb_path}:")
        for table in tables:
            print(f"  - {table}")
            
            # Zobrazíme aj stĺpce pre každú tabuľku
            try:
                columns = cursor.columns(table=table)
                for col in columns:
                    print(f"    {col.column_name} ({col.type_name})")
            except:
                pass
            print()
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error reading MDB: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python list_tables_python.py <mdb_path>")
        sys.exit(1)
    
    mdb_path = sys.argv[1]
    list_tables_from_mdb(mdb_path)
