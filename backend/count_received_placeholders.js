const insertQuery = `
  INSERT INTO received_invoices (
    company_id, invoice_number, supplier_name, supplier_ico, supplier_dic,
    supplier_address, issue_date, due_date, total_amount, vat_amount,
    kc0, kc1, kc2, kc3, kc_dph1, kc_dph2, kc_dph3, kc_celkem, var_sym, s_text,
    mdb_id, rel_tp_fak, datum, dat_splat, firma, ico, dic, ulice, psc, obec,
    mdb_cislo, base_0, base_1, base_2, base_3, vat_0, vat_1, vat_2, vat_3,
    varsym, currency, status, pohoda_id, notes, created_by, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

// Spočítanie placeholderov
const placeholderCount = (insertQuery.match(/\?/g) || []).length;
console.log('🔍 Počet placeholderov v INSERT statemente:', placeholderCount);

// Spočítanie stĺpcov
const columnMatch = insertQuery.match(/INSERT INTO received_invoices \(([^)]+)\)/);
if (columnMatch) {
  const columns = columnMatch[1].split(',').map(col => col.trim());
  console.log('🔍 Počet stĺpcov:', columns.length);
  console.log('📋 Stĺpce:');
  columns.forEach((col, index) => {
    console.log(`${index + 1}. ${col}`);
  });
}

// Spočítanie hodnôt v values array
const values = [
  3, // company_id
  'test', // invoice_number
  'test', // supplier_name
  'test', // supplier_ico
  'test', // supplier_dic
  'test', // supplier_address
  'test', // issue_date
  'test', // due_date
  100, // total_amount
  20, // vat_amount
  80, // kc0
  10, // kc1
  5, // kc2
  5, // kc3
  10, // kc_dph1
  5, // kc_dph2
  5, // kc_dph3
  100, // kc_celkem
  'test', // var_sym
  'test', // s_text
  1, // mdb_id
  1, // rel_tp_fak
  'test', // datum
  'test', // dat_splat
  'test', // firma
  'test', // ico
  'test', // dic
  'test', // ulice
  'test', // psc
  'test', // obec
  'test', // mdb_cislo
  80, // base_0
  10, // base_1
  5, // base_2
  5, // base_3
  10, // vat_0
  5, // vat_1
  5, // vat_2
  5, // vat_3
  'test', // varsym
  'EUR', // currency
  'received', // status
  null, // pohoda_id
  'test', // notes
  'system@import.com', // created_by
  'test', // created_at
  'test'  // updated_at
];

console.log('🔍 Počet hodnôt v values array:', values.length);

