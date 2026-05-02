import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Download, CreditCard, Eye, EyeOff } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

export default function CustomerBillingPortal() {
  const [showFullCard, setShowFullCard] = useState(false);

  const { data: userMe } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return user;
    }
  });

  const { data: metersResponse } = useQuery({
    queryKey: ['subscriptionMeters'],
    queryFn: async () => {
      const result = await base44.functions.invoke('manageBillingInvoices', {
        action: 'list',
        firm_email: userMe?.email
      });
      return result;
    },
    enabled: !!userMe
  });

  const { data: invoicesResponse } = useQuery({
    queryKey: ['billingInvoices'],
    queryFn: async () => {
      const result = await base44.functions.invoke('manageBillingInvoices', {
        action: 'list',
        firm_email: userMe?.email
      });
      return result.data?.invoices || [];
    },
    enabled: !!userMe
  });

  const meters = metersResponse?.data?.meters?.[0];
  const invoices = invoicesResponse || [];

  const statusColor = {
    'Starter': 'bg-blue-100 text-blue-800',
    'Professional': 'bg-purple-100 text-purple-800',
    'Premium': 'bg-pink-100 text-pink-800',
    'Enterprise': 'bg-amber-100 text-amber-800',
    'Free': 'bg-slate-100 text-slate-800'
  };

  const handleDownloadInvoice = async (invoiceId) => {
    toast.success('Invoice downloaded');
  };

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-slate-600">Manage your plan, invoices, and payment details</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-2">Active Tier</p>
              <Badge className={statusColor[meters?.subscription_tier || 'Free']}>
                {meters?.subscription_tier || 'Free'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">Billing Status</p>
              <Badge variant="outline">
                {meters?.subscription_active ? '✓ Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <h3 className="font-semibold">Usage This Month</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-600">Cases</p>
                <p className="text-lg font-semibold">{meters?.current_case_count || 0}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-600">Team Members</p>
                <p className="text-lg font-semibold">{meters?.current_user_count || 1}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-600">AI Gens</p>
                <p className="text-lg font-semibold">{meters?.ai_generations_this_month || 0}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-600">Exports</p>
                <p className="text-lg font-semibold">{meters?.document_exports_this_month || 0}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button>Upgrade Plan</Button>
            <Button variant="outline">View All Features</Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Your current payment information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-6 text-white relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <CreditCard className="w-8 h-8 opacity-20" />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Card Holder</p>
                <p className="font-semibold">{userMe?.full_name || 'Not Set'}</p>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Card Number</p>
                  <p className="font-mono text-lg">
                    {showFullCard ? '4242 4242 4242 4242' : '•••• •••• •••• 4242'}
                  </p>
                </div>
                <button onClick={() => setShowFullCard(!showFullCard)} className="hover:opacity-70">
                  {showFullCard ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Expires 12/28</span>
                <span className="text-slate-400">CVV: •••</span>
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full">Update Payment Method</Button>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Invoices and payment records</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-slate-600 py-8 text-center">No invoices yet. Your billing will appear here.</p>
          ) : (
            <div className="space-y-3">
              {invoices.map(invoice => (
                <div key={invoice.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{invoice.invoice_number}</p>
                    <p className="text-sm text-slate-600">
                      {format(parseISO(invoice.invoice_date), 'MMM dd, yyyy')} • £{invoice.amount_gbp}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'}>
                      {invoice.status}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoice(invoice.id)}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Management */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-900">Manage Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full">Pause Subscription</Button>
          <Button variant="outline" className="w-full">Cancel Subscription</Button>
          <p className="text-xs text-amber-800">
            Changes take effect at the end of your current billing cycle.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}