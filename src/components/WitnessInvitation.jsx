import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function WitnessInvitation({ caseId, caseRef, isOpen, onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('expert_witness');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const roles = [
    { value: 'surveyor', label: 'RICS Surveyor' },
    { value: 'expert_witness', label: 'Expert Witness' },
    { value: 'counsel', label: 'Counsel/Solicitor' },
    { value: 'other_professional', label: 'Other Professional' }
  ];

  const handleInvite = async () => {
    if (!email || !role) {
      setStatus({ type: 'error', message: 'Please enter email and select a role' });
      return;
    }

    setLoading(true);
    try {
      const result = await base44.functions.invoke('generateWitnessLink', {
        case_id: caseId,
        witness_email: email,
        witness_role: role
      });

      setStatus({
        type: 'success',
        message: `Invitation sent to ${email}. They'll receive a link to join case ${caseRef}.`
      });

      setEmail('');
      setRole('expert_witness');

      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
        setStatus(null);
      }, 2000);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to send invitation'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Invite RICS Professional
          </DialogTitle>
          <DialogDescription>
            Invite a surveyor or expert witness to collaborate on case {caseRef}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <p className="text-sm text-blue-900">
                💡 Witnesses will have secure access to this case only. They won't see your other cases.
              </p>
            </CardContent>
          </Card>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-900">Email Address</label>
            <Input
              type="email"
              placeholder="witness@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Role Select */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-900">Role</label>
            <Select value={role} onValueChange={setRole} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Messages */}
          {status && (
            <div className={`p-4 rounded-lg flex gap-3 ${
              status.type === 'success'
                ? 'bg-green-50 text-green-900'
                : 'bg-red-50 text-red-900'
            }`}>
              {status.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm">{status.message}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={loading || !email}
              className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Mail className="w-4 h-4" />
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}