#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import pyodbc
import os

def check_invoice_types_11(mdb_path):
    """Kontroluje faktúry s typom 11 v MDB súbore"""
    
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
        
        # Kontrola faktúr s typom 11
        print("=== FAKTÚRY S TYPOM 11 (PRIJATÉ FAKTÚRY) ===")
        query = """
        SELECT 
            ID, 
            Cislo, 
            Datum, 
            DatSplat, 
            Firma, 
            ICO, 
            DIC, 
            RelTpFak,
            SText
        FROM [FA] 
        WHERE RelTpFak = 11
        ORDER BY Datum DESC
        """
        
        cursor.execute(query)
        rows = cursor.fetchall()
        
        print(f"Počet faktúr s typom 11: {len(rows)}")
        print()
        
        for row in rows:
            print(f"ID: {row[0]}")
            print(f"Číslo: {row[1]}")
            print(f"Dátum: {row[2]}")
            print(f"Splatné: {row[3]}")
            print(f"Firma: {row[4]}")
            print(f"IČO: {row[5]}")
            print(f"DIČ: {row[6]}")
            print(f"RelTpFak: {row[7]}")
            print(f"SText: {row[8]}")
            print("-" * 50)
        
        # Kontrola všetkých typov faktúr
        print("\n=== VŠETKY TYPY FAKTÚR ===")
        query_all = """
        SELECT 
            RelTpFak,
            COUNT(*) as pocet,
            MIN(Cislo) as prva_faktura,
            MAX(Cislo) as posledna_faktura
        FROM [FA] 
        GROUP BY RelTpFak
        ORDER BY RelTpFak
        """
        
        cursor.execute(query_all)
        rows_all = cursor.fetchall()
        
        for row in rows_all:
            print(f"Typ {row[0]}: {row[1]} faktúr (od {row[2]} do {row[3]})")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python check_invoice_types_11.py <mdb_path>")
        sys.exit(1)
    
    mdb_path = sys.argv[1]
    check_invoice_types_11(mdb_path)
