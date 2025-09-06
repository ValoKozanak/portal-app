import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Employee, hrService } from '../services/hrService';
import { apiService } from '../services/apiService';

// Helper funkcia pre lokálne formátovanie dátumu
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
    // Doplnkové polia pre RČ a adresu (prefill z MDB)
    birth_number: '',
    permanent_street: '',
    permanent_city: '',
    permanent_zip: '',
    permanent_country: 'SK'
  });

  const [birthNumber, setBirthNumber] = useState('');
  const [prefillLoading, setPrefillLoading] = useState(false);
  // Návrh pracovného pomeru z MDB, ktorý môžeme upraviť pred uložením
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
        // Aktualizácia základných údajov zamestnanca
        const employeeData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone || undefined
        };
        await hrService.updateEmployee(employee!.id, employeeData);
      } else {
        // Vytvorenie základného záznamu zamestnanca
        const employeeData = {
          company_id: companyId,
          employee_id: `EMP${Date.now()}`, // Automaticky generované ID
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone || undefined,
          position: 'Zamestnanec', // Základná pozícia
          hire_date: formatDate(new Date()), // Dnešný dátum
          employment_type: 'full_time' as const, // Základný typ úväzku
          status: 'active' as const
        };
        
        const created = await hrService.addEmployee(employeeData);

        // Doplnenie RČ a adresy (ak sú k dispozícii) po vytvorení zamestnanca
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
          console.warn('Nepodarilo sa doplniť RČ/adresu po vytvorení.', e);
        }

        // Ak máme návrh pracovného pomeru, založ ho
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
            console.warn('Nepodarilo sa vytvoriť pracovný pomer.', e);
          }
        }
        
        // Vytvorenie používateľského účtu pre zamestnanca
        if (formData.password) {
          try {
            console.log('🔧 Vytváram používateľský účet pre zamestnanca:', formData.email);
            const userData = {
              email: formData.email,
              password: formData.password,
              name: `${formData.first_name} ${formData.last_name}`,
              role: 'employee',
              status: 'active',
              phone: formData.phone || undefined
            };
            console.log('📤 Odosielam dáta:', userData);
            await apiService.createUser(userData);
            console.log('✅ Používateľský účet vytvorený úspešne');
          } catch (error) {
            console.error('❌ Chyba pri vytváraní používateľského účtu:', error);
            const errorMessage = error instanceof Error ? error.message : 'Neznáma chyba';
            alert('Chyba pri vytváraní používateľského účtu: ' + errorMessage);
          }
        } else {
          console.log('⚠️ Heslo nie je zadané, používateľský účet sa nevytvorí');
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Chyba pri ukladaní zamestnanca:', error);
      alert('Chyba pri ukladaní zamestnanca');
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
            {isEdit ? 'Upraviť základné údaje zamestnanca' : 'Pridať nového zamestnanca a vytvoriť účet'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Načítať z POHODA (MDB) podľa RČ */}
          {!isEdit && (
            <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Načítať údaje z POHODA (MDB)</h3>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <input
                  type="text"
                  value={birthNumber}
                  onChange={(e) => setBirthNumber(e.target.value)}
                  placeholder="Rodné číslo (bez lomítka aj s lomítkom)"
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const normalized = (birthNumber || '').replace(/[^0-9]/g, '');
                    if (!normalized) { alert('Zadajte rodné číslo'); return; }
                    try {
                      setPrefillLoading(true);
                      const res = await hrService.getEmployeeFromMdb(companyId, normalized);
                      if (res && res.employee) {
                        const e = res.employee;
                        const ok = confirm('Našli sme údaje v MDB. Chcete predvyplniť formulár?');
                        if (ok) {
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

                          // Navrhnúť pracovný pomer z MDB (vezmi aktívny alebo prvý)
                          if (Array.isArray((e as any).employment_relations) && (e as any).employment_relations.length > 0) {
                            const rels = (e as any).employment_relations as any[];
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
                        }
                      } else {
                        alert('Údaje pre zadané RČ neboli nájdené.');
                      }
                    } catch (err) {
                      alert('Chyba pri načítaní z MDB');
                    } finally {
                      setPrefillLoading(false);
                    }
                  }}
                  disabled={prefillLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {prefillLoading ? 'Načítavam…' : 'Načítať z MDB'}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Hľadanie prebieha podľa IČO aktívnej firmy a rodného čísla v tabuľke ZAMSK.</p>
            </div>
          )}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Základné údaje zamestnanca</h3>
            
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
                  placeholder="Ján"
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
                  placeholder="Novák"
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
                  Telefón
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
                  Heslo pre prihlásenie *
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
                  Zamestnanec sa bude môcť prihlásiť s týmto emailom a heslom. 
                  Personálne údaje a pracovné pomery sa budú dopĺňať v sekciách "Karty zamestnancov" a "Pracovné pomery".
                </p>
              </div>
            )}
          </div>

          {/* Personálne údaje (RČ) a adresa trvalého pobytu */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Personálne údaje a adresa</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rodné číslo</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ulica a číslo</label>
                <input
                  type="text"
                  name="permanent_street"
                  value={formData.permanent_street}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="Hlavná 1"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PSČ</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Štát</label>
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

          {/* Návrh pracovného pomeru z MDB */}
          {!isEdit && relationDraft && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Návrh pracovného pomeru (z MDB)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pozícia</label>
                  <input
                    type="text"
                    value={relationDraft.position}
                    onChange={(e) => setRelationDraft(prev => prev ? ({ ...prev, position: e.target.value }) : prev)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Typ úväzku</label>
                  <select
                    value={relationDraft.employment_type}
                    onChange={(e) => setRelationDraft(prev => prev ? ({ ...prev, employment_type: e.target.value as any }) : prev)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  >
                    <option value="full_time">Plný úväzok</option>
                    <option value="part_time">Skrátený úväzok</option>
                    <option value="contract">Dohoda/kontrakt</option>
                    <option value="intern">Stáž</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dátum nástupu</label>
                  <input
                    type="date"
                    value={relationDraft.employment_start_date}
                    onChange={(e) => setRelationDraft(prev => prev ? ({ ...prev, employment_start_date: e.target.value }) : prev)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dátum ukončenia</label>
                  <input
                    type="date"
                    value={relationDraft.employment_end_date || ''}
                    onChange={(e) => setRelationDraft(prev => prev ? ({ ...prev, employment_end_date: e.target.value || undefined }) : prev)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Týždenné hodiny</label>
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
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Ukladám...' : (isEdit ? 'Upraviť' : 'Pridať')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;
