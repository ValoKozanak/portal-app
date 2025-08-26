#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import pyodbc
import os

def analyze_invoice_types(mdb_path):
    """Analyzuje typy faktúr v MDB súbore"""
    
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
        
        # Analýza typov faktúr
        print("=== ANALÝZA TYPOV FAKTÚR ===")
        
        # Získanie unikátnych hodnôt RelTpFak
        cursor.execute("SELECT DISTINCT RelTpFak FROM [FA] ORDER BY RelTpFak")
        tp_fak_values = cursor.fetchall()
        print(f"Unikátne hodnoty RelTpFak: {[row[0] for row in tp_fak_values]}")
        
        # Získanie unikátnych hodnôt RelDrFak
        cursor.execute("SELECT DISTINCT RelDrFak FROM [FA] ORDER BY RelDrFak")
        dr_fak_values = cursor.fetchall()
        print(f"Unikátne hodnoty RelDrFak: {[row[0] for row in dr_fak_values]}")
        
        # Analýza kombinácií
        print("\n=== KOMBINÁCIE TYPOV A DRUHOV FAKTÚR ===")
        cursor.execute("""
            SELECT RelTpFak, RelDrFak, COUNT(*) as pocet, 
                   MIN(Cislo) as prva_faktura, MAX(Cislo) as posledna_faktura
            FROM [FA] 
            GROUP BY RelTpFak, RelDrFak 
            ORDER BY RelTpFak, RelDrFak
        """)
        
        combinations = cursor.fetchall()
        for row in combinations:
            print(f"RelTpFak: {row[0]}, RelDrFak: {row[1]} -> {row[2]} faktúr (prvá: {row[3]}, posledná: {row[4]})")
        
        # Detailná analýza každej kombinácie
        print("\n=== DETAILNÁ ANALÝZA ===")
        for tp_fak, dr_fak, count, first_inv, last_inv in combinations:
            print(f"\n--- RelTpFak: {tp_fak}, RelDrFak: {dr_fak} ({count} faktúr) ---")
            
            cursor.execute("""
                SELECT Cislo, Firma, SText, Datum, KcCelkem
                FROM [FA] 
                WHERE RelTpFak = ? AND RelDrFak = ?
                ORDER BY Datum DESC
                LIMIT 3
            """, [tp_fak, dr_fak])
            
            sample_invoices = cursor.fetchall()
            for inv in sample_invoices:
                print(f"  {inv[0]} - {inv[1]} - {inv[2]} - {inv[3]} - {inv[4]} €")
        
        # Hľadanie faktúry 250100001
        print("\n=== HĽADANIE FAKTÚRY 250100001 ===")
        cursor.execute("""
            SELECT Cislo, RelTpFak, RelDrFak, Firma, SText, Datum, KcCelkem
            FROM [FA] 
            WHERE Cislo = '250100001'
        """)
        
        target_invoice = cursor.fetchone()
        if target_invoice:
            print(f"✅ Faktúra 250100001 sa našla:")
            print(f"  RelTpFak: {target_invoice[1]}")
            print(f"  RelDrFak: {target_invoice[2]}")
            print(f"  Firma: {target_invoice[3]}")
            print(f"  SText: {target_invoice[4]}")
            print(f"  Dátum: {target_invoice[5]}")
            print(f"  Suma: {target_invoice[6]} €")
        else:
            print("❌ Faktúra 250100001 sa nenašla")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error reading MDB: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python analyze_invoice_types.py <mdb_path>")
        sys.exit(1)
    
    mdb_path = sys.argv[1]
    analyze_invoice_types(mdb_path)
