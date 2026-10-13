'use client';

import { useEffect, useState } from 'react';
import { getUsers } from '@/lib/api';
import { UsersTable } from '@/components/admin/UsersTable';
import { Plus, Search, Filter } from 'lucide-react';

type UserStatus = 'all' | 'active' | 'inactive';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<UserStatus>('all');
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem('authToken') || '';
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await getUsers(token, 0, 100);
        
        // Map API users to admin table format
        const mappedUsers = data.users.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          status: u.status || 'active',
          joinDate: new Date(u.createdAt).toLocaleDateString(),
          phone: u.phone || 'N/A'
        }));
        
        setUsers(mappedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-gray-600">Manage customer accounts</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700">
          <Plus className="h-5 w-5" />
          Add User
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as UserStatus)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {loading ? (
          'Loading users...'
        ) : (
          <>
            Showing {filteredUsers.length} of {users.length} users
          </>
        )}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading users from database...</p>
        </div>
      ) : (
        <UsersTable users={filteredUsers} />
      )}
    </div>
  );
}
