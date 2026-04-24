import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import SaaSSwitcher from './SaaSSwitcher';
import SubscriptionManager from './SubscriptionManager';
import { Save, Shield, Bell, Palette, Key } from 'lucide-react';

export default function FirmSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firm_name: '',
    sra_number: '',
    address: '',
    phone: '',
    email: '',
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['firm-profile'],
    queryFn: async () => {
      const res = await base44.entities.PracticeProfile.list();
      if (res[0]) {
        setFormData(res[0]);
        return res[0];
      }
      return null;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.entities.PracticeProfile.update(profile.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firm-profile'] });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Settings & Administration</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your firm profile, team, and platform preferences</p>
        </div>

        <Tabs defaultValue="firm" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="firm" className="gap-2">
              <Shield className="w-4 h-4" /> Firm
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Shield className="w-4 h-4" /> Team
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              <Key className="w-4 h-4" /> Subscription
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Palette className="w-4 h-4" /> Preferences
            </TabsTrigger>
          </TabsList>

          {/* Firm Profile */}
          <TabsContent value="firm">
            <Card>
              <CardHeader>
                <CardTitle>Firm Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Firm Name</label>
                  <Input
                    value={formData.firm_name}
                    onChange={(e) => setFormData({ ...formData, firm_name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">SRA Registration Number</label>
                  <Input
                    value={formData.sra_number}
                    onChange={(e) => setFormData({ ...formData, sra_number: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => updateProfileMutation.mutate(formData)}
                  disabled={updateProfileMutation.isPending}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Management */}
          <TabsContent value="team">
            <SaaSSwitcher />
          </TabsContent>

          {/* Subscription */}
          <TabsContent value="subscription">
            <SubscriptionManager />
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Platform Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Email notifications for compliance alerts</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Sound notifications for critical incidents</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Weekly analytics summary email</span>
                  </label>
                </div>
                <Button className="gap-2">
                  <Save className="w-4 h-4" /> Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}