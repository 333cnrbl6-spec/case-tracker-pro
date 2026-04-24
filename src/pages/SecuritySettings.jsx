import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Eye, EyeOff, Key, AlertCircle, Check } from 'lucide-react';

export default function SecuritySettings() {
  const [show2FA, setShow2FA] = useState(false);

  return (
    <div className="space-y-6">
      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Password & Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Current Password</p>
            <input
              type="password"
              placeholder="Enter current password"
              className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">New Password</p>
            <input
              type="password"
              placeholder="Enter new password"
              className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
          <Button className="gap-2">
            <Lock className="w-4 h-4" /> Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Two-Factor Authentication
            </span>
            <Badge variant="outline" className="bg-amber-100 text-amber-900">Recommended</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            Protect your account with 2FA. You'll need to provide an additional verification method when logging in.
          </p>
          {!show2FA ? (
            <Button onClick={() => setShow2FA(true)} className="gap-2">
              <Key className="w-4 h-4" /> Enable 2FA
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium">Scan this QR code with your authenticator app:</p>
              <div className="bg-white p-4 rounded-lg w-fit">
                {/* QR code placeholder */}
                <div className="w-32 h-32 bg-slate-200 rounded flex items-center justify-center text-xs text-slate-500">
                  QR Code
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="gap-2">
                  <Check className="w-4 h-4" /> Confirm 2FA
                </Button>
                <Button variant="outline" onClick={() => setShow2FA(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-sm">Current Device</p>
                <p className="text-xs text-slate-500">Chrome on macOS</p>
              </div>
              <Badge>Active Now</Badge>
            </div>
            <p className="text-xs text-slate-500">Last activity: 2 minutes ago</p>
          </div>
          <Button variant="outline" className="w-full gap-2">
            <EyeOff className="w-4 h-4" /> Logout All Other Sessions
          </Button>
        </CardContent>
      </Card>

      {/* Security Audit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Security Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Account Security</p>
              <span className="text-2xl font-bold text-green-600">92%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Strong password, 2FA not enabled</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}