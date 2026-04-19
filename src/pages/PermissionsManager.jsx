import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import PERMISSIONS from '@/lib/permissions';

const ROLE_DESCRIPTIONS = {
  'Lead Investigator': 'Full access to investigations, evidence, and case management',
  'Legal Counsel': 'Access to legal analysis, evidence, and case decision-making',
  'General Auditor': 'Read-only access to incident data and compliance metrics',
  'admin': 'Full system access and user management',
};

const ROLE_COLORS = {
  'Lead Investigator': 'bg-blue-100 text-blue-800',
  'Legal Counsel': 'bg-purple-100 text-purple-800',
  'General Auditor': 'bg-green-100 text-green-800',
  'admin': 'bg-red-100 text-red-800',
};

export default function PermissionsManager() {
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const [selectedRole, setSelectedRole] = useState('Lead Investigator');

  const currentRolePermissions = Object.entries(PERMISSIONS).reduce((acc, [resource, actions]) => {
    Object.entries(actions).forEach(([action, roles]) => {
      if (roles.includes(selectedRole)) {
        if (!acc[resource]) acc[resource] = [];
        acc[resource].push(action);
      }
    });
    return acc;
  }, {});

  const usersWithRole = users.filter(u => u.data.role === selectedRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-slate-700" />
            <h1 className="text-4xl font-bold text-slate-900">Permissions Manager</h1>
          </div>
          <p className="text-slate-600">Manage role-based access control for RICS investigation data</p>
        </div>

        {/* Role Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(ROLE_DESCRIPTIONS).map(([role, description]) => (
            <Card
              key={role}
              className={`cursor-pointer transition-all ${selectedRole === role ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedRole(role)}
            >
              <CardHeader className="pb-3">
                <Badge className={ROLE_COLORS[role]}>{role}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-3">{description}</p>
                <p className="text-xs font-semibold text-slate-700">
                  {usersWithRole.length} user{usersWithRole.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Permissions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resources & Permissions */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  {selectedRole} Permissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(currentRolePermissions).map(([resource, actions]) => (
                    <div key={resource} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold text-slate-900 capitalize mb-3">{resource.replace(/_/g, ' ')}</h3>
                      <div className="flex flex-wrap gap-2">
                        {actions.map(action => (
                          <Badge key={action} variant="outline" className="capitalize">
                            <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                            {action.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users with Selected Role */}
          <div>
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                {usersWithRole.length > 0 ? (
                  <div className="space-y-3">
                    {usersWithRole.map(user => (
                      <div key={user.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{user.data.full_name}</p>
                          <p className="text-xs text-slate-600 truncate">{user.data.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 text-center py-8">No users with this role</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Permission Matrix */}
        <Card className="mt-8 bg-white border-slate-200">
          <CardHeader>
            <CardTitle>Complete Permission Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Resource</th>
                    {Object.keys(ROLE_DESCRIPTIONS).map(role => (
                      <th key={role} className="text-center py-3 px-4 font-semibold text-slate-700">
                        <div className="text-xs">{role}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(PERMISSIONS).map(([resource, actions]) =>
                    Object.entries(actions).map(([action, roles]) => (
                      <tr key={`${resource}-${action}`} className="border-b border-slate-100">
                        <td className="py-3 px-4 text-slate-700 capitalize">
                          {resource.replace(/_/g, ' ')} → {action.replace(/_/g, ' ')}
                        </td>
                        {Object.keys(ROLE_DESCRIPTIONS).map(role => (
                          <td key={role} className="text-center py-3 px-4">
                            {roles.includes(role) ? (
                              <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                            ) : (
                              <div className="w-4 h-4 border border-slate-300 rounded mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Security Notes */}
        <Alert className="mt-8 bg-blue-50 border-blue-200">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Role Guidelines:</strong> Lead Investigators manage investigations end-to-end. Legal Counsel reviews evidence and analysis. General Auditors have read-only access for compliance monitoring. Admins manage users and system settings.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}