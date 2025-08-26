#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import pyodbc
import os

def check_fa_structure(mdb_path):
    """Kontroluje štruktúru tabuľky FA v MDB súbore"""
    
    if not os.path.exists(mdb_path):
        print(f"Error: MDB file not found: {mdb_path}")
        return
    
    try:
        # Pripojenie k MDB súboru
        conn_str = f"Driver={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={mdb_path};"
        conn = pyodbc.connect(conn_str)
        
        # Nastavenie dekódovania pre CP-1250 (Windows-1250)
        conn.setdecoding(pyodbc.SQL_CHAR, encoding='cp1250')
        conn.setdecoding(pyodbc.SQL_WCHAR, encoding='utf-16le')
        conn.setencoding(encoding='utf-8')
        
        cursor = conn.cursor()
        
        # Získanie informácií o stĺpcoch tabuľky FA
        columns_query = """
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'FA'
        ORDER BY ORDINAL_POSITION
        """
        
        try:
            cursor.execute(columns_query)
            columns = cursor.fetchall()
            print("=== ŠTRUKTÚRA TABUĽKY FA ===")
            for col in columns:
                print(f"{col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'})")
        except:
            print("Nepodarilo sa získať štruktúru tabuľky cez INFORMATION_SCHEMA")
        
        # Zobrazenie prvých 3 riadkov z tabuľky FA
        print("\n=== PRVÉ 3 RIAДKY Z TABUĽKY FA ===")
        sample_query = "SELECT TOP 3 * FROM [FA]"
        cursor.execute(sample_query)
        rows = cursor.fetchall()
        
        # Získanie názvov stĺpcov
        column_names = [column[0] for column in cursor.description]
        print("Stĺpce:", column_names)
        
        for i, row in enumerate(rows, 1):
            print(f"\n--- Riadok {i} ---")
            for j, value in enumerate(row):
                print(f"{column_names[j]}: {value}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error reading MDB: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python check_fa_structure.py <mdb_path>")
        sys.exit(1)
    
    mdb_path = sys.argv[1]
    check_fa_structure(mdb_path)
