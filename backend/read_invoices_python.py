#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import pyodbc
import os

def read_invoices_from_mdb(mdb_path):
    """Číta vydané faktúry z MDB súboru s správnou konverziou kódovania"""
    
    if not os.path.exists(mdb_path):
        print(f"Error: MDB file not found: {mdb_path}")
        return []
    
    try:
        # Pripojenie k MDB súboru
        conn_str = f"Driver={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={mdb_path};"
        conn = pyodbc.connect(conn_str)
        
        # Nastavenie dekódovania pre CP-1250 (Windows-1250)
        conn.setdecoding(pyodbc.SQL_CHAR, encoding='cp1250')
        conn.setdecoding(pyodbc.SQL_WCHAR, encoding='utf-16le')
        conn.setencoding(encoding='utf-8')
        
        cursor = conn.cursor()
        
        # Čítanie vydaných faktúr z tabuľky FA (RelTpFak = 1 = vydané faktúry)
        query = """
        SELECT 
            ID, 
            Cislo, 
            Datum, 
            DatSplat, 
            Firma, 
            ICO, 
            DIC, 
            Ulice, 
            PSC, 
            Obec, 
            Kc0,
            Kc1,
            Kc2,
            Kc3,
            KcDPH1, 
            KcDPH2,
            KcDPH3,
            KcCelkem,
            VarSym,
            SText
        FROM [FA] 
        WHERE RelTpFak = 1
        ORDER BY Datum DESC
        """
        cursor.execute(query)
        
        invoices = []
        for row in cursor.fetchall():
            # Výpočet základu bez DPH (Kc0 + Kc1 + Kc2 + Kc3)
            base_amount = (float(row[10]) if row[10] else 0.0) + (float(row[11]) if row[11] else 0.0) + (float(row[12]) if row[12] else 0.0) + (float(row[13]) if row[13] else 0.0)
            
            # Výpočet celkovej DPH
            vat_total = (float(row[14]) if row[14] else 0.0) + (float(row[15]) if row[15] else 0.0) + (float(row[16]) if row[16] else 0.0)
            
            # Celková suma s DPH
            total_with_vat = float(row[17]) if row[17] else (base_amount + vat_total)
            
            invoice = {
                'id': row[0],
                'invoice_number': row[1] if row[1] else '',
                'issue_date': row[2].strftime('%Y-%m-%d') if row[2] else '',
                'due_date': row[3].strftime('%Y-%m-%d') if row[3] else '',
                'customer_name': row[4] if row[4] else '',
                'customer_ico': row[5] if row[5] else '',
                'customer_dic': row[6] if row[6] else '',
                'customer_address': f"{row[7] if row[7] else ''}, {row[8] if row[8] else ''} {row[9] if row[9] else ''}".strip(', '),
                'total_amount': base_amount,  # Základ bez DPH
                'vat_amount': vat_total,
                'total_with_vat': total_with_vat,
                'amount_0': float(row[10]) if row[10] else 0.0,  # Základ 0% DPH
                'amount_reduced': float(row[11]) if row[11] else 0.0,  # Základ 10% DPH
                'amount_basic': float(row[12]) if row[12] else 0.0,  # Základ 20% DPH
                'amount_3': float(row[13]) if row[13] else 0.0,  # Základ 3. DPH sadzba
                'vat_reduced': float(row[14]) if row[14] else 0.0,  # DPH 10%
                'vat_basic': float(row[15]) if row[15] else 0.0,  # DPH 20%
                'vat_3': float(row[16]) if row[16] else 0.0,  # DPH 3. sadzba
                'varsym': row[18] if row[18] else '',
                'notes': row[19] if row[19] else '',
                'currency': 'EUR',
                'status': 'sent'
            }
            invoices.append(invoice)
        
        cursor.close()
        conn.close()
        
        print(f"Found {len(invoices)} invoices")
        return invoices
        
    except Exception as e:
        print(f"Error reading MDB: {str(e)}")
        return []

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python read_invoices_python.py <mdb_path>")
        sys.exit(1)
    
    mdb_path = sys.argv[1]
    invoices = read_invoices_from_mdb(mdb_path)
    
    # Výstup ako JSON
    print("INVOICES_DATA_START")
    print(json.dumps(invoices, ensure_ascii=False, indent=2))
    print("INVOICES_DATA_END")
