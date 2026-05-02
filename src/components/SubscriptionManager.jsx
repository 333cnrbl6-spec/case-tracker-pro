import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function SubscriptionManager() {
  const [selectedTier, setSelectedTier] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [loading, setLoading] = useState(false);

  const { data: tiers } = useQuery({
    queryKey: ['pricingTiers'],
    queryFn: () => base44.entities.SubscriptionTier.list(),
    initialData: []
  });

  const { data: currentMeters } = useQuery({
    queryKey: ['subscriptionMeters'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.SubscriptionMeters.filter({ firm_email: user.email });
    },
    initialData: []
  });

  const current = currentMeters[0];

  const handleCheckout = async (tier) => {
    if (typeof window !== 'undefined' && window.self !== window.top) {
      toast.error('Checkout only works from the published app. Open in a new tab.');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('createStripeCheckout', {
        tier_name: tier.tier_name,
        billing_period: billingPeriod
      });

      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (err) {
      toast.error('Failed to create checkout: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const activeTier = tiers.find(t => t.tier_name === current?.subscription_tier);

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      {current && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Plan</span>
              <Badge className="bg-indigo-600">{current.subscription_tier}</Badge>
            </CardTitle>
            <CardDescription>
              Billing cycle: {current.billing_cycle_start} to {current.billing_cycle_end}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-600">Cases Used</p>
              <p className="text-2xl font-bold">{current.current_case_count}/{activeTier?.max_cases || '∞'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Team Members</p>
              <p className="text-2xl font-bold">{current.current_user_count}/{activeTier?.max_users || '∞'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">AI Generations</p>
              <p className="text-2xl font-bold">{current.ai_generations_this_month}/{activeTier?.max_ai_generations || '∞'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Exports</p>
              <p className="text-2xl font-bold">{current.document_exports_this_month}/{activeTier?.max_document_exports || '∞'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Period Selector */}
      <div className="flex gap-4 items-center">
        <span className="text-sm font-medium">Billing Period:</span>
        <button
          onClick={() => setBillingPeriod('monthly')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            billingPeriod === 'monthly'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingPeriod('annual')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            billingPeriod === 'annual'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          Annual (Save 15%)
        </button>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => {
          const isCurrent = tier.tier_name === current?.subscription_tier;
          const price = billingPeriod === 'annual' ? tier.annual_price : tier.monthly_price;

          return (
            <Card
              key={tier.tier_name}
              className={`flex flex-col transition-all ${
                isCurrent ? 'ring-2 ring-indigo-600 shadow-lg' : ''
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {tier.tier_name}
                  {isCurrent && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                </CardTitle>
                <div className="text-3xl font-bold">£{price.toFixed(0)}</div>
                <p className="text-xs text-slate-500">per month{billingPeriod === 'annual' && ' (billed annually)'}</p>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{tier.max_cases} cases</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{tier.max_users} team members</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{tier.max_ai_generations || 'Unlimited'} AI generations/mo</span>
                  </li>
                </ul>

                <Button
                  onClick={() => handleCheckout(tier)}
                  disabled={loading || isCurrent}
                  className="w-full mt-auto"
                  variant={isCurrent ? 'outline' : 'default'}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : (
                    'Upgrade'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Usage Warnings */}
      {current && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="w-5 h-5" />
              Usage Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {current.current_case_count >= activeTier?.max_cases && (
              <p className="text-sm text-amber-900">
                ⚠️ You've reached your case limit. Upgrade to create more cases.
              </p>
            )}
            {current.current_user_count >= activeTier?.max_users && (
              <p className="text-sm text-amber-900">
                ⚠️ You've reached your team member limit. Upgrade to add more users.
              </p>
            )}
            {!current.subscription_active && (
              <p className="text-sm text-red-900 font-semibold">
                ⚠️ Your subscription is inactive. Renew to continue using the app.
              </p>
            )}
            {current.upgrade_available && (
              <p className="text-sm text-blue-900">
                ℹ️ A higher tier is recommended based on your usage.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}