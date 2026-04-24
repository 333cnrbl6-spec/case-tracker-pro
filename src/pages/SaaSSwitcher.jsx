import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Check, AlertCircle, Users } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function SaaSSwitcher() {
  const { user } = useAuth();
  const [newOrgName, setNewOrgName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const queryClient = useQueryClient();

  const { data: orgProfile } = useQuery({
    queryKey: ['org-profile'],
    queryFn: () => base44.entities.PracticeProfile.list().then(r => r[0]),
    enabled: !!user,
  });

  const createOrgMutation = useMutation({
    mutationFn: async (name) => {
      const res = await base44.entities.PracticeProfile.create({
        firm_name: name,
        practice_areas: [],
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-profile'] });
      setNewOrgName('');
    },
  });

  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      await base44.users.inviteUser(email, role);
      return { email, role };
    },
    onSuccess: () => {
      setInviteEmail('');
      setInviteRole('user');
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['org-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Organization Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {orgProfile ? (
            <>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Firm Name</p>
                <p className="text-lg font-semibold">{orgProfile.firm_name}</p>
                {orgProfile.sra_number && (
                  <p className="text-sm text-slate-500">SRA: {orgProfile.sra_number}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Subscription Tier</p>
                <Badge className={orgProfile.subscription_tier === 'enterprise' ? 'bg-primary' : 'bg-secondary'}>
                  {orgProfile.subscription_tier || 'Starter'}
                </Badge>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Firm name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
              />
              <Button
                onClick={() => createOrgMutation.mutate(newOrgName)}
                disabled={!newOrgName || createOrgMutation.isPending}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Email address"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <select className="px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <Button
              onClick={() => inviteUserMutation.mutate({ email: inviteEmail, role: inviteRole })}
              disabled={!inviteEmail || inviteUserMutation.isPending}
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Invite
            </Button>
          </div>

          {inviteUserMutation.isError && (
            <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg text-sm text-red-700 dark:text-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {inviteUserMutation.error?.message || 'Failed to invite user'}
            </div>
          )}

          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{u.full_name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
                <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                  {u.role}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}