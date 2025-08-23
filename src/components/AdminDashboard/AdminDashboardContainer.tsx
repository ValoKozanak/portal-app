import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import LoadingSpinner from '../LoadingSpinner';

const AdminDashboardContainer: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Načítanie používateľov
  const loadUsers = async () => {
    console.log('🔄 Loading users...');
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAllUsers();
      console.log('✅ Users loaded:', data);
      console.log('🔍 First 3 users:', data.slice(0, 3));
      setUsers(data);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      setError('Chyba pri načítaní používateľov');
    } finally {
      setLoading(false);
      console.log('🏁 Loading finished');
    }
  };

  // Načítanie pri mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Funkcia na zobrazenie role
  const getRoleDisplay = (role: string) => {
    console.log('🎭 getRoleDisplay called with role:', role, 'type:', typeof role);
    switch (role) {
      case 'admin':
        return { text: 'Admin', color: 'bg-red-100 text-red-800' };
      case 'accountant':
        return { text: 'Účtovník', color: 'bg-blue-100 text-blue-800' };
      case 'employee':
        return { text: 'Zamestnanec', color: 'bg-purple-100 text-purple-800' };
      case 'user':
        return { text: 'Používateľ', color: 'bg-green-100 text-green-800' };
      default:
        console.log('⚠️ Unknown role:', role);
        return { text: role || 'Neznáma', color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Načítavam používateľov..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Chyba</h2>
          <p className="text-gray-600 mb-4">{error}</p>
        <button
            onClick={loadUsers}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Skúsiť znova
        </button>
        </div>
      </div>
    );
  }

        return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard - Používatelia</h1>
              <button
            onClick={loadUsers}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Obnoviť
              </button>
            </div>
            
        {/* Debug Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Info:</h3>
          <p className="text-sm text-yellow-700">Celkovo používateľov: {users.length}</p>
          {users.slice(0, 3).map(user => (
            <p key={user.id} className="text-xs text-yellow-600">
              {user.name} ({user.email}) - Rola: "{user.role}" - Status: "{user.status}"
            </p>
          ))}
              </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meno</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rola</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => {
                console.log('👤 Rendering user:', user.name, 'with role:', user.role);
                const roleDisplay = getRoleDisplay(user.role);
                return (
                        <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.id}
                          </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleDisplay.color}`}>
                        {roleDisplay.text}
                            </span>
                      <div className="text-xs text-gray-400 mt-1">Raw: "{user.role}"</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status === 'active' ? 'Aktívny' : 'Neaktívny'}
                            </span>
                          </td>
                        </tr>
                                  );
                                })}
                    </tbody>
                  </table>
            </div>
            
        {users.length === 0 && (
                <div className="text-center py-8">
            <p className="text-gray-500">Žiadni používatelia neboli nájdení</p>
                </div>
              )}
            </div>
          </div>
        );
};

export default AdminDashboardContainer;