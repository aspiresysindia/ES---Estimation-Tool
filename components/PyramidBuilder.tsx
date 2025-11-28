import React from 'react';
import { RoleConfig } from '../types';

interface PyramidBuilderProps {
  roles: RoleConfig[];
  setRoles: React.Dispatch<React.SetStateAction<RoleConfig[]>>;
}

export const PyramidBuilder: React.FC<PyramidBuilderProps> = ({ roles, setRoles }) => {
  const handleAddRole = () => {
    setRoles([...roles, { id: crypto.randomUUID(), roleName: 'New Role', percentage: 0 }]);
  };

  const handleChange = (id: string, field: keyof RoleConfig, value: string | number) => {
    setRoles((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleRemove = (id: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== id));
  };

  const totalPercentage = roles.reduce((acc, r) => acc + r.percentage, 0);
  const isInvalid = totalPercentage !== 100;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-slate-700">Resource Mix</h3>
        <span
          className={`text-xs font-bold px-2 py-1 rounded ${
            isInvalid ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}
        >
          Total: {totalPercentage}%
        </span>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Role / Grade</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Mix %</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {roles.map((role) => (
              <tr key={role.id}>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={role.roleName}
                    onChange={(e) => handleChange(role.id, 'roleName', e.target.value)}
                    className="w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-1"
                  />
                </td>
                <td className="px-3 py-2 w-24">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={role.percentage}
                    onChange={(e) => handleChange(role.id, 'percentage', parseFloat(e.target.value) || 0)}
                    className="w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-1"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => handleRemove(role.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={handleAddRole}
        className="w-full py-1 text-sm text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-50"
      >
        + Add Role
      </button>
    </div>
  );
};