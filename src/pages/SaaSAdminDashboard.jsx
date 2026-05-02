import React from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function SaaSAdminDashboard() {
  const { data: telemetry, isLoading: loadingTelemetry } = useQuery({
    queryKey: ['saasTelemetry'],
    queryFn: () => base44.functions.invoke('generateSaaSTelemetry', {}),
    initialData: { data: {} }
  });

  const { data: securityStatus } = useQuery({
    queryKey: ['securityStatus'],
    queryFn: () => base44.functions.invoke('validateSSLCertificates', {}),
    initialData: { data: { security_status: {} } }
  });

  const handleTestBackup = async () => {
    try {
      const result = await base44.functions.invoke('setupAutomatedBackups', {});
      toast.success('Backup test completed successfully');
    } catch (err) {
      toast.error('Backup test failed: ' + err.message);
    }
  };

  const data = telemetry.data?.telemetry || {};
  const security = securityStatus.data?.security_status || {};

  const TIER_COLORS = {
    Starter: '#3B82F6',
    Professional: '#8B5CF6',
    Premium: '#EC4899',
    Enterprise: '#F59E0B'
  };

  return (
    <div className="space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">SaaS Admin Dashboard</h1>
        <p className="text-slate-600">Platform overview, telemetry, and security settings</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.subscriptions?.active || 0}</div>
            <p className="text-xs text-slate-500 mt-1">
              Churn: {data.subscriptions?.churn_rate_percent || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Monthly Recurring Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">£{(data.revenue?.monthly_recurring_revenue || 0).toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">GBP</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Cases in System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.features?.total_cases || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Across all firms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">AI Generations (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.features?.ai_generations_month || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Feature usage</p>
          </CardContent>
        </Card>
      </div>

      {/* Security & Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Security & Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(security).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                {value === true ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : value === false ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : null}
                <div>
                  <p className="text-sm font-medium">{key.replace(/_/g, ' ').toUpperCase()}</p>
                  <p className="text-xs text-slate-500">{String(value)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleTestBackup} variant="outline">
              Test Backup
            </Button>
            <Button variant="outline" disabled>
              View Audit Logs (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Usage Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Cases', value: data.features?.total_cases || 0 },
              { name: 'Users', value: data.features?.total_users || 0 },
              { name: 'AI Gens', value: data.features?.ai_generations_month || 0 },
              { name: 'Exports', value: data.features?.document_exports_month || 0 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Audit Logs Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>Recent system events and admin actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-600 p-4 bg-slate-50 rounded-lg">
            Total audit events recorded: {data.audit_events || 0}
            <p className="text-xs mt-2 text-slate-500">
              Detailed audit logs are available in the Audit Log page. All user actions, security events, and system changes are tracked for compliance.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-900">Admin Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-amber-800">
            Use these controls for SaaS operations and maintenance:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline" disabled>Generate Invoice Report</Button>
            <Button variant="outline" disabled>Export Data for Analysis</Button>
            <Button variant="outline" disabled>Manage Tier Pricing</Button>
            <Button variant="outline" disabled>View Churn Analytics</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}