'use client';

import type { User } from '@/types/admin';

interface UsersTableProps {
  users: User[];
}

const STATUS_COLORS = {
  active: 'bg-green-50 text-green-700',
  inactive: 'bg-gray-50 text-gray-700',
};

export function UsersTable({ users }: UsersTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
              Orders
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
              Total Spent
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
              Joined
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {user.name}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
              <td className="px-6 py-4 text-sm">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    STATUS_COLORS[user.status]
                  }`}
                >
                  {user.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {user.totalOrders}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                ${(user.totalSpent || 0).toFixed(2)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {new Date(user.joinedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
