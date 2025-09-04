import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { hrService } from '../services/hrService';
import { EmploymentRelation } from '../types/EmploymentRelation';
import LoadingSpinner from '../components/LoadingSpinner';
import EmploymentRelationModal from '../components/EmploymentRelationModal';

interface EmploymentRelationsPageProps {
  companyId: number;
  userEmail: string;
  onBack: () => void;
}

const EmploymentRelationsPage: React.FC<EmploymentRelationsPageProps> = ({
  companyId,
  userEmail,
  onBack
}) => {
  const [loading, setLoading] = useState(true);
  const [employmentRelations, setEmploymentRelations] = useState<EmploymentRelation[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState<EmploymentRelation | null>(null);

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Načítanie zamestnancov firmy
      const employeesData = await hrService.getEmployees(companyId);
      setEmployees(employeesData);
      
      // Načítanie pracovných pomerov z API
      const relationsData = await hrService.getEmploymentRelations(companyId);
      setEmploymentRelations(relationsData);
    } catch (error) {
      console.error('Chyba pri načítaní dát:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRelations = employmentRelations.filter(relation =>
    relation.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relation.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relation.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddRelation = () => {
    setShowAddModal(true);
  };

  const handleEditRelation = (relation: EmploymentRelation) => {
    setSelectedRelation(relation);
    setShowEditModal(true);
  };

  const handleSaveRelation = async (relationData: EmploymentRelation) => {
    try {
      if (showEditModal && selectedRelation && selectedRelation.id) {
        // Edit existing relation
        await hrService.updateEmploymentRelation(selectedRelation.id, {
          position: relationData.position,
          employment_type: relationData.employment_type === 'dohoda' ? 'contract' : relationData.employment_type,
          employment_start_date: relationData.employment_start_date,
          employment_end_date: relationData.employment_termination_date,
          salary: relationData.salary,
          weekly_hours: relationData.agreed_weekly_hours,
          attendance_mode: relationData.attendance_mode,
          work_start_time: relationData.work_start_time,
          work_end_time: relationData.work_end_time,
          break_start_time: relationData.break_start_time,
          break_end_time: relationData.break_end_time,
          is_active: relationData.is_active
        });
      } else {
        // Add new relation
        await hrService.addEmploymentRelation({
          employee_id: relationData.employee_id,
          company_id: companyId,
          position: relationData.position,
          employment_type: relationData.employment_type === 'dohoda' ? 'contract' : relationData.employment_type,
          employment_start_date: relationData.employment_start_date,
          employment_end_date: relationData.employment_termination_date,
          salary: relationData.salary,
          weekly_hours: relationData.agreed_weekly_hours,
          attendance_mode: relationData.attendance_mode,
          work_start_time: relationData.work_start_time,
          work_end_time: relationData.work_end_time,
          break_start_time: relationData.break_start_time,
          break_end_time: relationData.break_end_time,
          is_active: relationData.is_active
        });
      }
      
      // Obnoviť dáta
      await loadData();
    } catch (error) {
      console.error('Chyba pri ukladaní pracovného pomeru:', error);
      alert('Chyba pri ukladaní pracovného pomeru');
    }
  };

  const handleDeleteRelation = (relationId: number) => {
    if (window.confirm('Naozaj chcete vymazať tento pracovný pomer?')) {
      try {

        setEmploymentRelations(prev => prev.filter(r => r.id !== relationId));
      } catch (error) {
        console.error('Chyba pri vymazaní pracovného pomeru:', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Aktívny' },
      inactive: { color: 'bg-gray-100 text-gray-800', label: 'Neaktívny' },
      terminated: { color: 'bg-red-100 text-red-800', label: 'Ukončený' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getEmploymentTypeLabel = (type: string) => {
    const labels = {
      'full_time': 'Plný úväzok',
      'part_time': 'Čiastočný úväzok',
      'contract': 'Dohoda',
      'intern': 'Stáž'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Späť
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pracovné pomery</h1>
              <p className="text-gray-600 dark:text-gray-300">Správa pracovných pomerov zamestnancov</p>
            </div>
          </div>
          <button
            onClick={handleAddRelation}
            className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Pridať pracovný pomer
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Hľadať zamestnanca alebo pozíciu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-dark-800 shadow rounded-lg overflow-hidden">
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
                    Typ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Začiatok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ukončenie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Mzda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Týždenné hodiny
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Dochádzka
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Pracovný čas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Aktuálne
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Akcie
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                {filteredRelations.map((relation) => (
                    <tr key={relation.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {relation.first_name} {relation.last_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {relation.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {relation.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {getEmploymentTypeLabel(relation.employment_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {relation.employment_start_date ? new Date(relation.employment_start_date).toLocaleDateString('sk-SK') : '-'}
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                       {relation.employment_termination_date ? new Date(relation.employment_termination_date).toLocaleDateString('sk-SK') : '-'}
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {relation.salary ? `${relation.salary} €` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {relation.weekly_hours ? `${relation.weekly_hours} hodín` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {relation.attendance_mode === 'automatic' ? 'Automatická' : 
                       relation.attendance_mode === 'manual' ? 'Manuálna' : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {relation.work_start_time && relation.work_end_time ? 
                        `${relation.work_start_time} - ${relation.work_end_time}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(
                        relation.employment_termination_date && new Date(relation.employment_termination_date) <= new Date() 
                          ? 'terminated' 
                          : (relation.is_active ? 'active' : 'inactive')
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditRelation(relation)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                                                 <button
                           onClick={() => relation.id && handleDeleteRelation(relation.id)}
                           className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                         >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRelations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Žiadne výsledky pre vyhľadávanie' : 'Žiadne pracovné pomery'}
              </p>
            </div>
          )}
        </div>

        {/* Modals */}
        {showAddModal && (
          <EmploymentRelationModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSave={handleSaveRelation}
            employees={employees}
            isEdit={false}
          />
        )}

        {showEditModal && selectedRelation && (
          <EmploymentRelationModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={handleSaveRelation}
            relation={selectedRelation}
            employees={employees}
            isEdit={true}
          />
        )}
      </div>
    </div>
  );
};

export default EmploymentRelationsPage;
