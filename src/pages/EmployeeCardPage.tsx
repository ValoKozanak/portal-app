import React, { useState, useEffect } from 'react';
import {
  ArrowLeftIcon,
  UserIcon,
  DocumentTextIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { hrService, Employee } from '../services/hrService';
import { apiService } from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import EditEmployeeModal from '../components/EditEmployeeModal';
import EmploymentRelationModal from '../components/EmploymentRelationModal';
import { EmploymentRelation } from '../types/EmploymentRelation';

interface EmployeeCardPageProps {
  userEmail: string;
  companyId: number;
  onBack: () => void;
  selectedEmployeeId?: number;
}

const EmployeeCardPage: React.FC<EmployeeCardPageProps> = ({ userEmail, companyId, onBack, selectedEmployeeId }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'personal'>('personal');
  const [showEditModal, setShowEditModal] = useState(false);
  const [employeeChanges, setEmployeeChanges] = useState<any[]>([]);
  const [showAddERModal, setShowAddERModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [companyId]);

  useEffect(() => {
    if (selectedEmployeeId && employees.length > 0) {
      const employee = employees.find(emp => emp.id === selectedEmployeeId);
      if (employee) {
        setSelectedEmployee(employee);
      }
    }
  }, [selectedEmployeeId, employees]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Na?TA?tanie zamestnancov z aktuA?lnej firmy
      const employeesData = await hrService.getEmployees(companyId);
      setEmployees(employeesData);
      
      // Na?TA?tanie zmien pre firmu
      const changesData = await hrService.getCompanyChanges(companyId);
      setEmployeeChanges(changesData);
    } catch (error) {
      console.error('Chyba pri na?TA?tanA? dA?t:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleEditEmployee = (employeeData: Partial<Employee>) => {
    if (!selectedEmployee) return;
    
    const updatedEmployee = { ...selectedEmployee, ...employeeData };
    
    // Async function sa volA?, ale nevraciam Promise
    (async () => {
      try {
        await hrService.updateEmployee(selectedEmployee.id!, updatedEmployee);
        
        // Aktualizuj zoznam zamestnancov
        const employeesData = await hrService.getEmployees(companyId);
        setEmployees(employeesData);
        
        // Aktualizuj vybranA?ho zamestnanca
        const updatedSelectedEmployee = employeesData.find(emp => emp.id === selectedEmployee.id);
        if (updatedSelectedEmployee) {
          setSelectedEmployee(updatedSelectedEmployee);
        }
        
        setShowEditModal(false);
      } catch (error) {
        console.error('Chyba pri aktualizA?cii zamestnanca:', error);
      }
    })();
  };

  const filteredEmployees = employees.filter(employee =>
    employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Funkcia na zA?skanie stavu zmeny pre pole
  const getFieldChangeStatus = (employeeId: number, fieldName: string) => {
    const change = employeeChanges.find(c => 
      c.employee_id === employeeId && 
      c.field_name === fieldName && 
      c.status === 'pending'
    );
    
    if (change) {
      return {
        status: 'pending',
        reason: change.reason,
        changeId: change.id
      };
    }
    
    const approvedChange = employeeChanges.find(c => 
      c.employee_id === employeeId && 
      c.field_name === fieldName && 
      c.status === 'approved'
    );
    
    if (approvedChange) {
      return {
        status: 'approved',
        reason: approvedChange.reason,
        changeId: approvedChange.id
      };
    }
    
    return null;
  };

  // Funkcia na schvA?lenie zmeny
  const handleApproveChange = async (changeId: number, employeeId: number, fieldName: string, newValue: string) => {
    try {
      // SchvA?liLA zmenu
      await hrService.approveEmployeeChange(changeId, 1); // TODO: pouLliLA skuto?TnA? ID schva?lovate?la
      
      // AktualizovaLA Asdaje zamestnanca
      await hrService.updateEmployeeField(employeeId, fieldName, newValue);
      
      // ObnoviLA dA?ta
      await loadData();
      
      alert('Zmena bola AsspeL?ne schvA?lenA?');
    } catch (error) {
      console.error('Chyba pri schva?lovanA? zmeny:', error);
      alert('Chyba pri schva?lovanA? zmeny');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Na?TA?tavam karty zamestnancov..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            SpA?LA na Dashboard
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Karty zamestnancov</h1>
            <p className="text-gray-600 dark:text-gray-300">DetailnA? personA?lne Asdaje zamestnancov</p>
          </div>
        </div>
      </div>

      {/* Informa?TnA? box */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              PersonA?lne Asdaje zamestnancov
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>Tu dop?sL?ate detailnA? personA?lne Asdaje pre zamestnancov, ktorA? uLl majAs vytvorenA? As?Tet v sekcii "Zamestnanci".</p>
              <p>Pre pridanie novA?ho zamestnanca pouLlite sekciu "Zamestnanci".</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtre */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vyh?ladA?vanie zamestnancov
          </label>
          <input
            type="text"
            placeholder="H?ladaLA zamestnancov..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zoznam zamestnancov */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-600">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Zoznam zamestnancov
              </h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  onClick={() => setSelectedEmployee(employee)}
                  className={`p-4 border-b border-gray-200 dark:border-dark-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 ${
                    selectedEmployee?.id === employee.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-dark-600 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {employee.first_name} {employee.last_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {employee.position}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {employee.employee_id}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredEmployees.length === 0 && (
                <div className="text-center py-8">
                  <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    {searchTerm ? 'L?iadni zamestnanci nenA?jdenA?' : 'L?iadni zamestnanci'}
                  </h3>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detail karty zamestnanca */}
        <div className="lg:col-span-2">
          {selectedEmployee ? (
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow">
              {/* Header karty */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-600">
                                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {selectedEmployee.first_name} {selectedEmployee.last_name}
                              </h2>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {selectedEmployee.position} ??? {selectedEmployee.employee_id}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setShowEditModal(true)}
                                className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <PencilIcon className="h-4 w-4 mr-1" />
                                UpraviLA
                              </button>
                              <button
                                onClick={() => setShowAddERModal(true)}
                                className="flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                              >
                                NovA? pracovnA? pomer
                              </button>
                    <button
                      onClick={() => setActiveTab('personal')}
                      className={`px-3 py-1 text-sm font-medium rounded-md ${
                        activeTab === 'personal'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                      PersonA?lne
                    </button>

                  </div>
                </div>
              </div>

              {/* Obsah karty */}
              <div className="p-6">
                <PersonalDataTab 
                  employee={selectedEmployee} 
                  employeeChanges={employeeChanges}
                  onApproveChange={handleApproveChange}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-12 text-center">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Vyberte zamestnanca
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Kliknite na zamestnanca z ?lavA?ho zoznamu pre zobrazenie jeho karty
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Employee Modal */}
      {selectedEmployee && (
        <EditEmployeeModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditEmployee}
          employee={selectedEmployee}
        />
      )}

      {/* Employment Relation Modal (Create) */}
      {selectedEmployee && (
        <EmploymentRelationModal
          isOpen={showAddERModal}
          onClose={() => setShowAddERModal(false)}
          onSave={async (relationData: EmploymentRelation) => {
            try {
              await hrService.addEmploymentRelation({
                employee_id: Number(selectedEmployee.id),
                company_id: Number(companyId),
                position: relationData.position,
                employment_type: relationData.employment_type === 'dohoda' ? 'contract' : relationData.employment_type,
                employment_start_date: relationData.employment_start_date,
                employment_end_date: relationData.employment_termination_date,
                salary: Number(String(relationData.salary).replace(',', '.')) || 0,
                weekly_hours: Number(relationData.agreed_weekly_hours) || 40,
                attendance_mode: relationData.attendance_mode,
                work_start_time: relationData.work_start_time,
                work_end_time: relationData.work_end_time,
                break_start_time: relationData.break_start_time,
                break_end_time: relationData.break_end_time,
                is_active: Boolean(relationData.is_active)
              });
              setShowAddERModal(false);
              alert('PracovnA? pomer bol AsspeL?ne pridanA?');
            } catch (e) {
              console.error('Chyba pri pridanA? pracovnA?ho pomeru:', e);
              alert('Chyba pri pridanA? pracovnA?ho pomeru');
            }
          }}
          relation={{
            employee_id: selectedEmployee.id,
            employee_first_name: selectedEmployee.first_name,
            employee_last_name: selectedEmployee.last_name,
            employee_email: selectedEmployee.email,
            birth_number: selectedEmployee.birth_number || '',
            position: '',
            position_name: '',
            employment_type: 'full_time',
            employment_start_date: '',
            is_active: true,
            salary: 0,
            agreed_weekly_hours: 40,
            attendance_mode: 'manual',
            work_start_time: '08:00',
            work_end_time: '16:00',
            break_start_time: '12:00',
            break_end_time: '12:30',
            weekly_hours: 40,
          } as unknown as EmploymentRelation}
          employees={[selectedEmployee as unknown as Employee]}
          isEdit={false}
        />
      )}
    </div>
  );
};

// Komponent pre personA?lne Asdaje
const PersonalDataTab: React.FC<{ 
  employee: Employee;
  employeeChanges: any[];
  onApproveChange: (changeId: number, employeeId: number, fieldName: string, newValue: string) => void;
}> = ({ employee, employeeChanges, onApproveChange }) => {
  
  // Funkcia na zA?skanie stavu zmeny pre pole
  const getFieldChangeStatus = (fieldName: string) => {
    // H?ladanie najnovL?ej pending zmeny (pod?la ID)
    const pendingChanges = employeeChanges.filter(c => 
      c.employee_id === employee.id && 
      c.field_name === fieldName && 
      c.status === 'pending'
    );
    
    if (pendingChanges.length > 0) {
      // VrA?tiLA najnovL?iu pending zmenu (s najvyL?L?A?m ID)
      const latestPendingChange = pendingChanges.reduce((latest, current) => 
        (current.id > latest.id) ? current : latest
      );
      
      return {
        status: 'pending',
        reason: latestPendingChange.reason,
        changeId: latestPendingChange.id,
        newValue: latestPendingChange.new_value
      };
    }
    
    // H?ladanie najnovL?ej approved zmeny
    const approvedChanges = employeeChanges.filter(c => 
      c.employee_id === employee.id && 
      c.field_name === fieldName && 
      c.status === 'approved'
    );
    
    if (approvedChanges.length > 0) {
      const latestApprovedChange = approvedChanges.reduce((latest, current) => 
        (current.id > latest.id) ? current : latest
      );
      
      return {
        status: 'approved',
        reason: latestApprovedChange.reason,
        changeId: latestApprovedChange.id,
        newValue: latestApprovedChange.new_value
      };
    }
    
    return null;
  };
  return (
    <div className="space-y-6">
      {/* ZA?kladnA? Asdaje */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">ZA?kladnA? Asdaje</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DataField 
            label="Priezvisko" 
            value={employee.last_name} 
            employeeId={employee.id}
            fieldName="last_name"
            changeStatus={getFieldChangeStatus('last_name')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="Meno" 
            value={employee.first_name} 
            employeeId={employee.id}
            fieldName="first_name"
            changeStatus={getFieldChangeStatus('first_name')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="RodnA? priezvisko" 
            value={employee.birth_name || '-'} 
            employeeId={employee.id}
            fieldName="birth_name"
            changeStatus={getFieldChangeStatus('birth_name')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="Titul pred" 
            value={employee.title_before || '-'} 
            employeeId={employee.id}
            fieldName="title_before"
            changeStatus={getFieldChangeStatus('title_before')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="Titul za" 
            value={employee.title_after || '-'} 
            employeeId={employee.id}
            fieldName="title_after"
            changeStatus={getFieldChangeStatus('title_after')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="Pohlavie" 
            value={employee.gender || '-'} 
            employeeId={employee.id}
            fieldName="gender"
            changeStatus={getFieldChangeStatus('gender')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="DA?tum narodenia" 
            value={employee.birth_date ? new Date(employee.birth_date).toLocaleDateString('sk-SK') : '-'} 
            employeeId={employee.id}
            fieldName="birth_date"
            changeStatus={getFieldChangeStatus('birth_date')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="RodnA? ?TA?slo" 
            value={employee.birth_number || '-'} 
            employeeId={employee.id}
            fieldName="birth_number"
            changeStatus={getFieldChangeStatus('birth_number')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="Miesto narodenia" 
            value={employee.birth_place || '-'} 
            employeeId={employee.id}
            fieldName="birth_place"
            changeStatus={getFieldChangeStatus('birth_place')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="NA?rodnosLA" 
            value={employee.nationality || '-'} 
            employeeId={employee.id}
            fieldName="nationality"
            changeStatus={getFieldChangeStatus('nationality')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="L?tA?t ob?Tianstvo" 
            value={employee.citizenship || '-'} 
            employeeId={employee.id}
            fieldName="citizenship"
            changeStatus={getFieldChangeStatus('citizenship')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="Vzdelanie" 
            value={employee.education || '-'} 
            employeeId={employee.id}
            fieldName="education"
            changeStatus={getFieldChangeStatus('education')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="RodinnA? stav" 
            value={employee.marital_status || '-'} 
            employeeId={employee.id}
            fieldName="marital_status"
            changeStatus={getFieldChangeStatus('marital_status')}
            onApproveChange={onApproveChange}
          />
          <DataField label="Spolo?TnA?k" value={employee.is_partner ? 'A?no' : 'Nie'} />
          <DataField label="L?tatutA?r" value={employee.is_statutory ? 'A?no' : 'Nie'} />
        </div>
      </div>

      {/* Adresa trvalA?ho pobytu */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Adresa trvalA?ho pobytu</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DataField 
            label="Ulica" 
            value={employee.permanent_street || '-'} 
            employeeId={employee.id}
            fieldName="permanent_street"
            changeStatus={getFieldChangeStatus('permanent_street')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="?SA?slo popisnA?" 
            value={employee.permanent_number || '-'} 
            employeeId={employee.id}
            fieldName="permanent_number"
            changeStatus={getFieldChangeStatus('permanent_number')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="Obec" 
            value={employee.permanent_city || '-'} 
            employeeId={employee.id}
            fieldName="permanent_city"
            changeStatus={getFieldChangeStatus('permanent_city')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="PS?S" 
            value={employee.permanent_zip || '-'} 
            employeeId={employee.id}
            fieldName="permanent_zip"
            changeStatus={getFieldChangeStatus('permanent_zip')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="L?tA?t" 
            value={employee.permanent_country || '-'} 
            employeeId={employee.id}
            fieldName="permanent_country"
            changeStatus={getFieldChangeStatus('permanent_country')}
            onApproveChange={onApproveChange}
          />
        </div>
      </div>

      {/* KontaktnA? adresa */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">KontaktnA? adresa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DataField 
            label="Ulica" 
            value={employee.contact_street || '-'} 
            employeeId={employee.id}
            fieldName="contact_street"
            changeStatus={getFieldChangeStatus('contact_street')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="?SA?slo popisnA?" 
            value={employee.contact_number || '-'} 
            employeeId={employee.id}
            fieldName="contact_number"
            changeStatus={getFieldChangeStatus('contact_number')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="Obec" 
            value={employee.contact_city || '-'} 
            employeeId={employee.id}
            fieldName="contact_city"
            changeStatus={getFieldChangeStatus('contact_city')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="PS?S" 
            value={employee.contact_zip || '-'} 
            employeeId={employee.id}
            fieldName="contact_zip"
            changeStatus={getFieldChangeStatus('contact_zip')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="L?tA?t" 
            value={employee.contact_country || '-'} 
            employeeId={employee.id}
            fieldName="contact_country"
            changeStatus={getFieldChangeStatus('contact_country')}
            onApproveChange={onApproveChange}
          />
          <DataField 
            label="TelefAln" 
            value={employee.phone || '-'} 
            employeeId={employee.id}
            fieldName="phone"
            changeStatus={getFieldChangeStatus('phone')}
            onApproveChange={onApproveChange}
          />
          <DataField label="E-mail" value={employee.email} />
        </div>
      </div>

      {/* CudzineckA? Asdaje */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">CudzineckA? Asdaje</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DataField label="Cudzinec" value={employee.is_foreigner ? 'A?no' : 'Nie'} />
          <DataField label="L?tA?t (cudzinec)" value={employee.foreigner_country || '-'} />
          <DataField label="?SA?slo povolenia k pobytu" value={employee.residence_permit_number || '-'} />
          <DataField label="?SA?slo soc. poist. v SR" value={employee.social_insurance_sr || '-'} />
          <DataField label="?SA?slo soc. poist. v zahrani?TA?" value={employee.social_insurance_foreign || '-'} />
          <DataField label="?SA?slo zdrav. poist. v SR" value={employee.health_insurance_sr || '-'} />
          <DataField label="Cudzinec bez trv. pobytu v SR" value={employee.foreigner_without_permanent_residence ? 'A?no' : 'Nie'} />
          <DataField label="Identifika?TnA? ?TA?slo na daL?ovA? As?Tely" value={employee.tax_identification_number || '-'} />
        </div>
      </div>
    </div>
  );
};



// PomocnA? komponent pre zobrazenie AsdajovA?ho po?la
const DataField: React.FC<{ 
  label: string; 
  value: string; 
  employeeId?: number;
  fieldName?: string;
  changeStatus?: any;
  onApproveChange?: (changeId: number, employeeId: number, fieldName: string, newValue: string) => void;
}> = ({ label, value, employeeId, fieldName, changeStatus, onApproveChange }) => (
  <div className="relative">
    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900 dark:text-white pr-8">
      {changeStatus && changeStatus.status === 'pending' ? changeStatus.newValue : value}
    </dd>
    
    {changeStatus && (
      <div className="absolute top-0 right-0">
        {changeStatus.status === 'pending' && (
          <button
            onClick={() => onApproveChange?.(changeStatus.changeId, employeeId!, fieldName!, changeStatus.newValue)}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            title={`dz"" ?SakajAsca zmena od zamestnanca

dz"t DA?vod: ${changeStatus.reason}
dz?. NovA? hodnota: ${changeStatus.newValue}

Kliknite pre schvA?lenie zmeny.`}
          >
            <PencilIcon className="w-4 h-4" />
          </button>
        )}
        {changeStatus.status === 'approved' && (
          <div className="text-green-500 dark:text-green-400" title={`?s. SchvA?lenA? zmena

dz"t DA?vod: ${changeStatus.reason}
dz?. NovA? hodnota: ${changeStatus.newValue}

Zmena bola schvA?lenA? a aplikovanA?.`}>
            <PencilIcon className="w-4 h-4" />
          </div>
        )}
      </div>
    )}
  </div>
);

// PomocnA? funkcie
const getEmploymentTypeLabel = (type: string) => {
  const labels = {
    'full_time': 'PlnA? AsvA?zok',
    'part_time': '?Siasto?TnA? AsvA?zok',
    'contract': 'Dohoda',
    'intern': 'StA?Ll'
  };
  return labels[type as keyof typeof labels] || type;
};

const getStatusLabel = (status: string) => {
  const labels = {
    'active': 'AktA?vny',
    'inactive': 'NeaktA?vny',
    'terminated': 'Ukon?TenA?',
    'on_leave': 'Na dovolenke'
  };
  return labels[status as keyof typeof labels] || status;
};

export default EmployeeCardPage;

