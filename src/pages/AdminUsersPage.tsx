import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon,
  UsersIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import AddUserModal from '../components/AddUserModal';
import EditUserModal from '../components/EditUserModal';
import AssignCompanyModal from '../components/AssignCompanyModal';
import { apiService } from '../services/apiService';

interface AdminUsersPageProps {
  onBack: () => void;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'accountant' | 'user';
  status: 'active' | 'inactive';
  phone?: string;
  lastLogin?: string;
}

const AdminUsersPage: React.FC<AdminUsersPageProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showAssignCompanyModal, setShowAssignCompanyModal] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [selectedUserForAssign, setSelectedUserForAssign] = useState<User | null>(null);

  // Načítanie používateľov z API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const usersData = await apiService.getAllUsers();
        const usersWithLastLogin = usersData.map(user => ({
          ...user,
          lastLogin: 'Nikdy'
        }));
        setUsers(usersWithLastLogin);
      } catch (error) {
        console.error('Chyba pri načítaní používateľov:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Filtrovanie používateľov podľa vyhľadávania
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Vytvorenie nového používateľa
  const handleAddUser = async (userData: any) => {
    try {
      const response = await apiService.createUser(userData);
      const newUser = {
        id: response.userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: userData.status,
        phone: userData.phone || '',
        lastLogin: 'Nikdy'
      };
      setUsers(prev => [...prev, newUser]);
      setShowAddUserModal(false);
    } catch (error: any) {
      console.error('Chyba pri vytváraní používateľa:', error.message);
      alert(`Chyba pri vytváraní používateľa: ${error.message}`);
    }
  };

  // Úprava používateľa
  const handleEditUser = async (userId: number, userData: any) => {
    try {
      await apiService.updateUser(userId, userData);
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...userData } : user
      ));
      setShowEditUserModal(false);
      setSelectedUserForEdit(null);
    } catch (error: any) {
      console.error('Chyba pri aktualizácii používateľa:', error.message);
      alert(`Chyba pri aktualizácii používateľa: ${error.message}`);
    }
  };

  // Vymazanie používateľa
  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Naozaj chcete vymazať tohto používateľa?')) {
      try {
        await apiService.deleteUser(userId);
        setUsers(prev => prev.filter(user => user.id !== userId));
      } catch (error: any) {
        console.error('Chyba pri mazaní používateľa:', error.message);
        alert(`Chyba pri mazaní používateľa: ${error.message}`);
      }
    }
  };

  // Otvorenie modálu pre úpravu
  const handleOpenEditUser = (user: User) => {
    setSelectedUserForEdit(user);
    setShowEditUserModal(true);
  };

  // Otvorenie modálu pre priradenie firmy
  const handleOpenAssignCompany = (user: User) => {
    setSelectedUserForAssign(user);
    setShowAssignCompanyModal(true);
  };

  // Helper funkcie pre badge
  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    const labels = {
      active: 'Aktívny',
      inactive: 'Neaktívny',
      pending: 'Čakajúci'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      accountant: 'bg-blue-100 text-blue-800',
      user: 'bg-gray-100 text-gray-800'
    };
    const labels = {
      admin: 'Admin',
      accountant: 'Účtovník',
      user: 'Používateľ'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[role as keyof typeof colors]}`}>
        {labels[role as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Späť do Dashboardu
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center">
                <UsersIcon className="h-8 w-8 text-blue-500 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Správa používateľov</h1>
              </div>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Pridať používateľa
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Zoznam používateľov</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Celkovo {users.length} používateľov • {users.filter(u => u.status === 'active').length} aktívnych
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Vyhľadať používateľa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Načítavam používateľov...</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Používateľ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posledné prihlásenie
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Akcie
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <EnvelopeIcon className="h-4 w-4 mr-1" />
                                {user.email}
                              </div>
                              {user.phone && (
                                <div className="text-sm text-gray-500 flex items-center">
                                  <PhoneIcon className="h-4 w-4 mr-1" />
                                  {user.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLogin || 'Nikdy'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenEditUser(user)}
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                            >
                              <PencilIcon className="h-4 w-4 mr-1" />
                              Upraviť
                            </button>
                            {user.role === 'accountant' && (
                              <button
                                onClick={() => handleOpenAssignCompany(user)}
                                className="text-green-600 hover:text-green-900 flex items-center"
                              >
                                <UsersIcon className="h-4 w-4 mr-1" />
                                Priradiť firmy
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
                              Vymazať
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <UsersIcon className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {searchTerm ? 'Žiadni používatelia nenájdení' : 'Žiadni používatelia'}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm 
                    ? 'Skúste zmeniť vyhľadávací výraz.'
                    : 'Začnite pridávaním prvého používateľa.'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 flex items-center mx-auto"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Pridať prvého používateľa
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onAddUser={handleAddUser}
      />

      <EditUserModal
        isOpen={showEditUserModal}
        onClose={() => {
          setShowEditUserModal(false);
          setSelectedUserForEdit(null);
        }}
        onSave={(userData) => selectedUserForEdit && handleEditUser(selectedUserForEdit.id, userData)}
        user={selectedUserForEdit}
      />

      <AssignCompanyModal
        isOpen={showAssignCompanyModal}
        onClose={() => {
          setShowAssignCompanyModal(false);
          setSelectedUserForAssign(null);
        }}
        companies={[]}
        accountants={[]}
        onAssign={() => {
          setShowAssignCompanyModal(false);
          setSelectedUserForAssign(null);
        }}
      />
    </div>
  );
};

export default AdminUsersPage;
