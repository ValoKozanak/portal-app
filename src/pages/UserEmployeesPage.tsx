import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon,
  UserIcon,
  ClockIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { hrService, Employee, Attendance, LeaveRequest } from '../services/hrService';
import { apiService } from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import EditEmployeeModal from '../components/EditEmployeeModal';

// Helper funkcia pre lokálne formátovanie dátumu
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface UserEmployeesPageProps {
  userEmail: string;
  onBack: () => void;
}

interface EmployeeWithDetails extends Employee {
  attendance?: Attendance[];
  leave_requests?: LeaveRequest[];
}

const UserEmployeesPage: React.FC<UserEmployeesPageProps> = ({ userEmail, onBack }) => {
  const [employees, setEmployees] = useState<EmployeeWithDetails[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Načítanie firiem používateľa
      const userCompanies = await apiService.getUserCompanies(userEmail);
      setCompanies(userCompanies);
      
      if (userCompanies.length > 0) {
        setSelectedCompany(userCompanies[0]);
        
        // Načítanie zamestnancov pre prvú firmu
        const employeesData = await hrService.getEmployees(userCompanies[0].id);
        
        // Načítanie dochádzky a dovoleniek pre každého zamestnanca
        const employeesWithDetails = await Promise.all(
          employeesData.map(async (employee) => {
            try {
              const [attendance, leaveRequests] = await Promise.all([
                hrService.getAttendance(userCompanies[0].id, employee.id),
                hrService.getLeaveRequests(userCompanies[0].id)
              ]);
              
              return {
                ...employee,
                attendance: attendance.filter(att => att.employee_id === employee.id),
                leave_requests: leaveRequests.filter(leave => leave.employee_id === employee.id)
              };
            } catch (error) {
              console.error(`Chyba pri načítaní detailov pre zamestnanca ${employee.id}:`, error);
              return {
                ...employee,
                attendance: [],
                leave_requests: []
              };
            }
          })
        );
        
        setEmployees(employeesWithDetails);
      }
    } catch (error) {
      console.error('Chyba pri načítaní dát:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = async (companyId: number) => {
    try {
      const company = companies.find(c => c.id === companyId);
      setSelectedCompany(company);
      
      const employeesData = await hrService.getEmployees(companyId);
      
      // Načítanie dochádzky a dovoleniek pre každého zamestnanca
      const employeesWithDetails = await Promise.all(
        employeesData.map(async (employee) => {
          try {
            const [attendance, leaveRequests] = await Promise.all([
              hrService.getAttendance(companyId, employee.id),
              hrService.getLeaveRequests(companyId)
            ]);
            
            return {
              ...employee,
              attendance: attendance.filter(att => att.employee_id === employee.id),
              leave_requests: leaveRequests.filter(leave => leave.employee_id === employee.id)
            };
          } catch (error) {
            console.error(`Chyba pri načítaní detailov pre zamestnanca ${employee.id}:`, error);
            return {
              ...employee,
              attendance: [],
              leave_requests: []
            };
          }
        })
      );
      
      setEmployees(employeesWithDetails);
    } catch (error) {
      console.error('Chyba pri načítaní zamestnancov:', error);
    }
  };

     const getEmployeeStatus = (employee: EmployeeWithDetails) => {
             const today = formatDate(new Date());
     
     // Najprv kontrolujeme status zamestnania z databázy
     if (employee.status === 'terminated') {
       return { status: 'terminated', label: 'Ukončený', color: 'red', icon: XCircleIcon };
     }
     
     if (employee.status === 'inactive') {
       return { status: 'inactive', label: 'Neaktívny', color: 'gray', icon: XCircleIcon };
     }
     
     if (employee.status === 'on_leave') {
       return { status: 'on_leave', label: 'Na dovolenke', color: 'blue', icon: CalendarIcon };
     }
     
     // Kontrola dochádzky na dnešný deň
     const todayAttendance = employee.attendance?.find(att => att.date === today);
     
     if (todayAttendance) {
       if (todayAttendance.status === 'present') {
         return { status: 'working', label: 'Pracuje', color: 'green', icon: CheckCircleIcon };
       } else if (todayAttendance.status === 'late') {
         return { status: 'late', label: 'Mešká', color: 'yellow', icon: ExclamationTriangleIcon };
       } else if (todayAttendance.status === 'absent') {
         return { status: 'absent', label: 'Neprítomný', color: 'red', icon: XCircleIcon };
       }
     }
     
     // Kontrola dovoleniek
     const activeLeave = employee.leave_requests?.find(leave => 
       leave.status === 'approved' && 
       leave.start_date <= today && 
       leave.end_date >= today
     );
     
     if (activeLeave) {
       return { status: 'leave', label: 'Dovolenka', color: 'blue', icon: CalendarIcon };
     }
     
     // Kontrola choroby
     const sickLeave = employee.leave_requests?.find(leave => 
       leave.status === 'approved' && 
       leave.leave_type === 'sick_leave' &&
       leave.start_date <= today && 
       leave.end_date >= today
     );
     
     if (sickLeave) {
       return { status: 'sick', label: 'Choroba', color: 'red', icon: XCircleIcon };
     }
     
     // Ak je aktívny ale nemá zaznamenanú dochádzku, považujeme za neprítomného
     if (employee.status === 'active') {
       return { status: 'unknown', label: 'Neprítomný', color: 'gray', icon: XCircleIcon };
     }
     
     // Fallback
     return { status: 'unknown', label: 'Neznámy stav', color: 'gray', icon: XCircleIcon };
   };

  const getStatusColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'red':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'blue':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

     const workingCount = employees.filter(emp => {
     const status = getEmployeeStatus(emp);
     return status.status === 'working';
   }).length;
   
   const notWorkingCount = employees.filter(emp => {
     const status = getEmployeeStatus(emp);
     return status.status !== 'working';
   }).length;

   const handleEditEmployee = async (employeeData: Partial<Employee>) => {
     if (!selectedEmployee) return;
     
     try {
       await hrService.updateEmployee(selectedEmployee.id, employeeData);
       
       // Aktualizuj zoznam zamestnancov
       await loadData();
       
       setShowEditModal(false);
       setSelectedEmployee(null);
     } catch (error) {
       console.error('Chyba pri aktualizácii zamestnanca:', error);
       alert('Chyba pri aktualizácii zamestnanca');
     }
   };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Načítavam zamestnancov..." />
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
            Späť na Dashboard
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Zamestnanci</h1>
            <p className="text-gray-600 dark:text-gray-300">Prehľad zamestnancov a ich aktuálnych stavov</p>
          </div>
        </div>
      </div>

      {/* Štatistiky */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pracujú</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{workingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Nepracujú</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{notWorkingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Celkovo</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{employees.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtre */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Výber firmy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Firma
            </label>
            <select
              value={selectedCompany?.id || ''}
              onChange={(e) => handleCompanyChange(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
            >
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vyhľadávanie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vyhľadávanie
            </label>
            <input
              type="text"
              placeholder="Hľadať zamestnancov..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Zoznam zamestnancov */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-600">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Zoznam zamestnancov {selectedCompany && `- ${selectedCompany.name}`}
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Zamestnanec
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Pozícia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Kontakt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Aktuálny stav
                </th>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                   Dátum nástupu
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                   Akcie
                 </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
              {filteredEmployees.map((employee) => {
                const status = getEmployeeStatus(employee);
                const StatusIcon = status.icon;
                
                return (
                  <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-dark-600 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {employee.first_name} {employee.last_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.employee_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{employee.position}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{employee.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{employee.email}</div>
                      {employee.phone && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">{employee.phone}</div>
                      )}
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center">
                         <StatusIcon className={`h-4 w-4 mr-2 ${status.color === 'green' ? 'text-green-600 dark:text-green-400' : 
                           status.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                           status.color === 'red' ? 'text-red-600 dark:text-red-400' :
                           status.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                           'text-gray-600 dark:text-gray-400'}`} />
                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status.color)}`}>
                           {status.label}
                         </span>
                       </div>
                     </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                       {new Date(employee.hire_date).toLocaleDateString('sk-SK')}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                       <button
                         onClick={() => {
                           setSelectedEmployee(employee);
                           setShowEditModal(true);
                         }}
                         className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-dark-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                       >
                         <PencilIcon className="h-4 w-4 mr-1" />
                         Upraviť
                       </button>
                     </td>
                   </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredEmployees.length === 0 && (
            <div className="text-center py-8">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {searchTerm ? 'Žiadni zamestnanci nenájdení' : 'Žiadni zamestnanci'}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm 
                  ? 'Skúste zmeniť vyhľadávací výraz' 
                  : 'V tejto firme nie sú žiadni zamestnanci'
                }
              </p>
            </div>
          )}
                 </div>
       </div>

       {/* Edit Employee Modal */}
       <EditEmployeeModal
         isOpen={showEditModal}
         onClose={() => {
           setShowEditModal(false);
           setSelectedEmployee(null);
         }}
         onSave={handleEditEmployee}
         employee={selectedEmployee}
       />
     </div>
   );
 };

export default UserEmployeesPage;
