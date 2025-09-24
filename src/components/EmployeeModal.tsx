import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Employee, hrService } from '../services/hrService';
import { apiService } from '../services/apiService';

// Helper funkcia pre lokA?lne formA?tovanie dA?tumu
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  companyId: number;
  onSuccess: () => void;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  employee,
  companyId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    // DoplnkovA? polia pre R?S a adresu (prefill z MDB)
    birth_number: '',
    permanent_street: '',
    permanent_city: '',
    permanent_zip: '',
    permanent_country: 'SK'
  });

  const [birthNumber, setBirthNumber] = useState('');
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [mdbCandidate, setMdbCandidate] = useState<any | null>(null);
  // NA?vrh pracovnA?ho pomeru z MDB, ktorA? mA?Lleme upraviLA pred uloLlenA?m
  const [relationDraft, setRelationDraft] = useState<null | {
    position: string;
    employment_type: 'full_time' | 'part_time' | 'contract' | 'intern';
    employment_start_date: string;
    employment_end_date?: string | null;
    weekly_hours?: number | null;
  }>(null);

  const [loading, setLoading] = useState(false);

  const isEdit = !!employee;

  useEffect(() => {
    if (isOpen) {
      if (employee) {
        setFormData({
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          phone: employee.phone || '',
          password: '',
          birth_number: (employee as any).birth_number || '',
          permanent_street: (employee as any).permanent_street || '',
          permanent_city: (employee as any).permanent_city || '',
          permanent_zip: (employee as any).permanent_zip || '',
          permanent_country: (employee as any).permanent_country || 'SK'
        });
      } else {
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          password: '',
          birth_number: '',
          permanent_street: '',
          permanent_city: '',
          permanent_zip: '',
          permanent_country: 'SK'
        });
        setRelationDraft(null);
      }
    }
  }, [isOpen, employee]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        // AktualizA?cia zA?kladnA?ch Asdajov zamestnanca
        const employeeData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone || undefined
        };
        await hrService.updateEmployee(employee!.id, employeeData);
      } else {
        // Vytvorenie zA?kladnA?ho zA?znamu zamestnanca
        const employeeData = {
          company_id: companyId,
          employee_id: `EMP${Date.now()}`, // Automaticky generovanA? ID
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone || undefined,
          position: 'Zamestnanec', // ZA?kladnA? pozA?cia
          hire_date: formatDate(new Date()), // DneL?nA? dA?tum
          employment_type: 'full_time' as const, // ZA?kladnA? typ AsvA?zku
          status: 'active' as const
        };
        
        const created = await hrService.addEmployee(employeeData);

        // Doplnenie R?S a adresy (ak sAs k dispozA?cii) po vytvorenA? zamestnanca
        try {
          const normalizedRC = (formData.birth_number || birthNumber || '').replace(/[^0-9]/g, '');
          await hrService.updateEmployee(created.id, {
            birth_number: normalizedRC || undefined,
            permanent_street: formData.permanent_street || undefined,
            permanent_city: formData.permanent_city || undefined,
            permanent_zip: formData.permanent_zip || undefined,
            permanent_country: formData.permanent_country || undefined
          } as any);
        } catch (e) {
          console.warn('Nepodarilo sa doplniLA R?S/adresu po vytvorenA?.', e);
        }

        // Ak mA?me nA?vrh pracovnA?ho pomeru, zaloLl ho
        if (relationDraft && relationDraft.employment_start_date) {
          try {
            await hrService.addEmploymentRelation({
              employee_id: created.id,
              company_id: companyId,
              position: relationDraft.position || 'Zamestnanec',
              employment_type: relationDraft.employment_type || 'full_time',
              employment_start_date: relationDraft.employment_start_date,
              employment_end_date: relationDraft.employment_end_date || undefined,
              weekly_hours: relationDraft.weekly_hours || undefined
            });
          } catch (e) {
            console.warn('Nepodarilo sa vytvoriLA pracovnA? pomer.', e);
          }
        }
        
        // Vytvorenie pouLlA?vate?lskA?ho As?Ttu pre zamestnanca
        if (formData.password) {
          try {
            console.log('dz"? VytvA?ram pouLlA?vate?lskA? As?Tet pre zamestnanca:', formData.email);
            const userData = {
              email: formData.email,
              password: formData.password,
              name: `${formData.first_name} ${formData.last_name}`,
              role: 'employee',
              status: 'active',
              phone: formData.phone || undefined
            };
            console.log('dz"? Odosielam dA?ta:', userData);
            await apiService.createUser(userData);
            console.log('?s. PouLlA?vate?lskA? As?Tet vytvorenA? AsspeL?ne');
          } catch (error) {
            console.error('?tS Chyba pri vytvA?ranA? pouLlA?vate?lskA?ho As?Ttu:', error);
            const errorMessage = error instanceof Error ? error.message : 'NeznA?ma chyba';
            alert('Chyba pri vytvA?ranA? pouLlA?vate?lskA?ho As?Ttu: ' + errorMessage);
          }
        } else {
          console.log('?s?d?Z Heslo nie je zadanA?, pouLlA?vate?lskA? As?Tet sa nevytvorA?');
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Chyba pri ukladanA? zamestnanca:', error);
      alert('Chyba pri ukladanA? zamestnanca');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'UpraviLA zA?kladnA? Asdaje zamestnanca' : 'PridaLA novA?ho zamestnanca a vytvoriLA As?Tet'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* MDB prefill banner */}
          {!isEdit && mdbCandidate && (
            <div className="p-4 rounded-md border border-purple-200 bg-purple-50 dark:bg-dark-700 dark:border-dark-600">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-sm text-gray-800 dark:text-gray-100">
                  NaL?li sme Asdaje v MDB pre R?S. ChceL? predvyplniLA formulA?r z POHODA?
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    onClick={() => {
                      const e = mdbCandidate as any;
                      setFormData(prev => ({
                        ...prev,
                        first_name: e.first_name || prev.first_name,
                        last_name: e.last_name || prev.last_name,
                        email: prev.email,
                        phone: prev.phone || '',
                        birth_number: (e.birth_number || '').replace(/[^0-9]/g, ''),
                        permanent_street: e.permanent_street || prev.permanent_street,
                        permanent_city: e.permanent_city || prev.permanent_city,
                        permanent_zip: e.permanent_zip || prev.permanent_zip,
                        permanent_country: e.permanent_country || prev.permanent_country
                      }));
                      setBirthNumber(((e.birth_number as string) || '').replace(/[^0-9]/g, ''));

                      // priprav nA?vrh pracovnA?ho pomeru
                      if (Array.isArray(e.employment_relations) && e.employment_relations.length > 0) {
                        const rels = e.employment_relations as any[];
                        const pick = rels.find(r => !r.employment_end_date) || rels[0];
                        const toISO = (v: any) => {
                          if (!v) return '';
                          const s = String(v);
                          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
                          const m = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
                          if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
                          const d = new Date(s);
                          return isNaN(d.getTime()) ? '' : d.toISOString().slice(0,10);
                        };
                        setRelationDraft({
                          position: pick.position || 'Zamestnanec',
                          employment_type: (pick.employment_type as any) || 'full_time',
                          employment_start_date: toISO(pick.employment_start_date) || formatDate(new Date()),
                          employment_end_date: pick.employment_end_date ? toISO(pick.employment_end_date) : undefined,
                          weekly_hours: pick.weekly_hours ? Number(pick.weekly_hours) : 40
                        });
                      }

                      setMdbCandidate(null);
                    }}
                  >PredvyplniLA</button>
                  <button
                    type="button"
                    className="px-3 py-2 bg-gray-200 dark:bg-dark-600 text-gray-800 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-dark-500"
                    onClick={() => setMdbCandidate(null)}
                  >ZavrieLA</button>
                </div>
              </div>
            </div>
          )}
          {/* Na?TA?taLA z POHODA (MDB) pod?la R?S */}
          {!isEdit && (
            <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Na?TA?taLA Asdaje z POHODA (MDB)</h3>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <input
                  type="text"
                  value={birthNumber}
                  onChange={(e) => setBirthNumber(e.target.value)}
                  placeholder="RodnA? ?TA?slo (bez lomA?tka aj s lomA?tkom)"
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const normalized = (birthNumber || '').replace(/[^0-9]/g, '');
                    if (!normalized) { alert('Zadajte rodnA? ?TA?slo'); return; }
                    try {
                      setPrefillLoading(true);
                      const now = new Date().getFullYear();
                      const years = [now, now - 1, now - 2];
                      let found: any = null;
                      for (const y of years) {
                        try {
                          const r = await hrService.getEmployeeFromMdb(companyId, normalized, y);
                          if (r && r.employee) { found = r.employee; break; }
                        } catch (_) { /* skAssiLA ?ZalL?A? rok */ }
                      }
                      if (found) {
                        setMdbCandidate(found);
                      } else {
                        alert('Asdaje pre zadanA? R?S neboli nA?jdenA? v poslednA?ch rokoch.');
                      }
                    } catch (err) {
                      alert('Chyba pri na?TA?tanA? z MDB');
                    } finally {
                      setPrefillLoading(false);
                    }
                  }}
                  disabled={prefillLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {prefillLoading ? 'Na?TA?tavam???' : 'Na?TA?taLA z MDB'}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">H?ladanie prebieha pod?la I?SO aktA?vnej firmy a rodnA?ho ?TA?sla v tabu?lke ZAMSK.</p>
            </div>
          )}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">ZA?kladnA? Asdaje zamestnanca</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Meno *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="JA?n"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priezvisko *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="NovA?k"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="jan.novak@firma.sk"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  TelefAln
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="+421 901 234 567"
                />
              </div>
            </div>

            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Heslo pre prihlA?senie *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!isEdit}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="Zadajte heslo pre zamestnanca"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Zamestnanec sa bude mA?cLA prihlA?siLA s tA?mto emailom a heslom. 
                  PersonA?lne Asdaje a pracovnA? pomery sa budAs dop?sL?aLA v sekciA?ch "Karty zamestnancov" a "PracovnA? pomery".
                </p>
              </div>
            )}
          </div>

          {/* PersonA?lne Asdaje (R?S) a adresa trvalA?ho pobytu */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">PersonA?lne Asdaje a adresa</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RodnA? ?TA?slo</label>
                  <input
                    type="text"
                    name="birth_number"
                    value={formData.birth_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                    placeholder="123456/7890"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ulica a ?TA?slo</label>
                <input
                  type="text"
                  name="permanent_street"
                  value={formData.permanent_street}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="HlavnA? 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mesto</label>
                <input
                  type="text"
                  name="permanent_city"
                  value={formData.permanent_city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="Bratislava"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PS?S</label>
                <input
                  type="text"
                  name="permanent_zip"
                  value={formData.permanent_zip}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="811 01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">L?tA?t</label>
                <input
                  type="text"
                  name="permanent_country"
                  value={formData.permanent_country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="SK"
                />
              </div>
            </div>
          </div>

          {/* NA?vrh pracovnA?ho pomeru z MDB */}
          {!isEdit && relationDraft && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">NA?vrh pracovnA?ho pomeru (z MDB)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PozA?cia</label>
                  <input
                    type="text"
                    value={relationDraft.position}
                    onChange={(e) => setRelationDraft(prev => prev ? ({ ...prev, position: e.target.value }) : prev)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Typ AsvA?zku</label>
                  <select
                    value={relationDraft.employment_type}
                    onChange={(e) => setRelationDraft(prev => prev ? ({ ...prev, employment_type: e.target.value as any }) : prev)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  >
                    <option value="full_time">PlnA? AsvA?zok</option>
                    <option value="part_time">SkrA?tenA? AsvA?zok</option>
                    <option value="contract">Dohoda/kontrakt</option>
                    <option value="intern">StA?Ll</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DA?tum nA?stupu</label>
                  <input
                    type="date"
                    value={relationDraft.employment_start_date}
                    onChange={(e) => setRelationDraft(prev => prev ? ({ ...prev, employment_start_date: e.target.value }) : prev)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DA?tum ukon?Tenia</label>
                  <input
                    type="date"
                    value={relationDraft.employment_end_date || ''}
                    onChange={(e) => setRelationDraft(prev => prev ? ({ ...prev, employment_end_date: e.target.value || undefined }) : prev)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">TA?LldennA? hodiny</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={relationDraft.weekly_hours ?? 40}
                    onChange={(e) => setRelationDraft(prev => prev ? ({ ...prev, weekly_hours: Number(e.target.value) || 40 }) : prev)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-dark-600">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded-md hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
            >
              ZruL?iLA
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'UkladA?m...' : (isEdit ? 'UpraviLA' : 'PridaLA')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;

