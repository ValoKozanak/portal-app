#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import pyodbc
import os

def find_invoice_250100001(mdb_path):
    """Hľadá faktúru 250100001 v MDB súbore"""
    
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
        
        # Hľadanie faktúry 250100001
        query = """
        SELECT 
            ID, Cislo, Datum, DatSplat, Firma, ICO, DIC, 
            RelTpFak, RelDrFak, SText, RelObDPH,
            Kc0, Kc1, Kc2, Kc3, KcDPH1, KcDPH2, KcDPH3, KcCelkem,
            VarSym, PDoklad
        FROM [FA] 
        WHERE Cislo = '250100001'
        """
        
        cursor.execute(query)
        rows = cursor.fetchall()
        
        if rows:
            row = rows[0]
            print("=== FAKTÚRA 250100001 ===")
            print(f"ID: {row[0]}")
            print(f"Číslo: {row[1]}")
            print(f"Dátum: {row[2]}")
            print(f"Dátum splatnosti: {row[3]}")
            print(f"Firma: {row[4]}")
            print(f"IČO: {row[5]}")
            print(f"DIČ: {row[6]}")
            print(f"RelTpFak: {row[7]} (typ faktúry)")
            print(f"RelDrFak: {row[8]} (druh faktúry)")
            print(f"SText: {row[9]}")
            print(f"RelObDPH: {row[10]} (obdobie DPH)")
            print(f"Kc0: {row[11]} (základ 0% DPH)")
            print(f"Kc1: {row[12]} (základ 10% DPH)")
            print(f"Kc2: {row[13]} (základ 20% DPH)")
            print(f"Kc3: {row[14]} (základ 3. DPH)")
            print(f"KcDPH1: {row[15]} (DPH 10%)")
            print(f"KcDPH2: {row[16]} (DPH 20%)")
            print(f"KcDPH3: {row[17]} (DPH 3. sadzba)")
            print(f"KcCelkem: {row[18]} (celkom)")
            print(f"VarSym: {row[19]}")
            print(f"PDoklad: {row[20]}")
        else:
            print("Faktúra 250100001 sa nenašla v tabuľke FA")
        
        # Skontrolujeme aj iné tabuľky
        print("\n=== KONTROLA INÝCH TABUĽIEK ===")
        
        # Zoznam možných tabuliek
        possible_tables = ['FV', 'FA', 'Faktury', 'VydaneFaktury', 'PrijateFaktury']
        
        for table in possible_tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM [{table}]")
                count = cursor.fetchone()[0]
                print(f"Tabuľka {table}: {count} záznamov")
                
                if count > 0:
                    # Skúsime nájsť faktúru 250100001 v tejto tabuľke
                    try:
                        cursor.execute(f"SELECT Cislo FROM [{table}] WHERE Cislo = '250100001'")
                        result = cursor.fetchone()
                        if result:
                            print(f"  ✅ Faktúra 250100001 sa našla v tabuľke {table}")
                        else:
                            print(f"  ❌ Faktúra 250100001 sa nenašla v tabuľke {table}")
                    except:
                        print(f"  ⚠️ Nepodarilo sa vyhľadať v tabuľke {table}")
                        
            except:
                print(f"Tabuľka {table}: neexistuje")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error reading MDB: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python find_invoice_250100001.py <mdb_path>")
        sys.exit(1)
    
    mdb_path = sys.argv[1]
    find_invoice_250100001(mdb_path)
