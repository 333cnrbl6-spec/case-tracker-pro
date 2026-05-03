import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissions } from '@/lib/PermissionContext';
import { AlertCircle, Settings, BarChart3, FileText } from 'lucide-react';

export default function DeveloperPortal() {
  const permissions = usePermissions();
  const DEVELOPER_EMAIL = 'developer@casenarrative.io';
  const isDeveloper = permissions.email === DEVELOPER_EMAIL;

  if (!isDeveloper) {
    return (
      <div className="min-h-screen bg-red-50 p-6 flex items-center justify-center">
        <Card className="max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="w-6 h-6" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800">
              This portal is restricted to authorized developers only.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Developer Portal</h1>
          <p className="text-slate-600 mt-1">Sales, marketing, and system administration tools</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Sales Tools */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Sales Materials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-700">
                Generate and manage sales collateral for law firm outreach.
              </p>
              <ul className="text-sm space-y-2 text-slate-700">
                <li>• Product sheet PDFs</li>
                <li>• Case study templates</li>
                <li>• Trial offer configuration</li>
                <li>• ROI calculators</li>
              </ul>
            </CardContent>
          </Card>

          {/* Marketing Tools */}
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Marketing Assets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-700">
                Create marketing materials and track campaign performance.
              </p>
              <ul className="text-sm space-y-2 text-slate-700">
                <li>• Email templates</li>
                <li>• Blog content generation</li>
                <li>• Feature comparison sheets</li>
                <li>• Campaign analytics</li>
              </ul>
            </CardContent>
          </Card>

          {/* System Admin */}
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-700">
                Configure platform-wide settings and manage integrations.
              </p>
              <ul className="text-sm space-y-2 text-slate-700">
                <li>• Subscription tier management</li>
                <li>• Demo data seeding</li>
                <li>• Feature flag management</li>
                <li>• System health monitoring</li>
              </ul>
            </CardContent>
          </Card>

          {/* Database Tools */}
          <Card className="border-2 border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-600" />
                Database Utilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-700">
                Manage test data and database operations.
              </p>
              <ul className="text-sm space-y-2 text-slate-700">
                <li>• Create demo cases (Bradley v Belcher)</li>
                <li>• Data cleanup and migration</li>
                <li>• User permission audits</li>
                <li>• Backup verification</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Security Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">
              This portal is restricted to: <strong>{DEVELOPER_EMAIL}</strong>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              All actions in this portal are logged for audit and compliance purposes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}