import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const PLANS = [
  {
    name: 'Starter',
    price: '£199',
    period: 'month',
    features: [
      'Up to 5 active cases',
      '10 team members',
      'Core compliance monitoring',
      'Email support',
      'Basic reports',
    ],
    cta: 'Current Plan',
    badge: 'starter',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '£599',
    period: 'month',
    features: [
      'Unlimited cases',
      '50 team members',
      'Advanced AI analysis',
      'Priority support',
      'Unlimited reports',
      'API access',
      'Custom integrations',
    ],
    cta: 'Upgrade Now',
    badge: 'professional',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact sales',
    features: [
      'Everything in Professional',
      'Dedicated account manager',
      'Custom SLA',
      'White-label options',
      'On-premise deployment',
      'Advanced security',
    ],
    cta: 'Contact Sales',
    badge: 'enterprise',
    highlighted: false,
  },
];

export default function SubscriptionManager() {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState('monthly');

  return (
    <div className="space-y-8">
      {/* Current Subscription */}
      <Card className="border-primary bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Subscription Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Current Plan</p>
              <p className="text-2xl font-bold">Professional</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Renewal Date</p>
              <p className="text-lg font-semibold">May 24, 2026</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Team Capacity</p>
              <p className="text-lg font-semibold">32 / 50 members</p>
            </div>
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90">Manage Billing</Button>
        </CardContent>
      </Card>

      {/* Billing Cycle Toggle */}
      <div className="flex gap-2">
        <Button
          variant={billingCycle === 'monthly' ? 'default' : 'outline'}
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly Billing
        </Button>
        <Button
          variant={billingCycle === 'annual' ? 'default' : 'outline'}
          onClick={() => setBillingCycle('annual')}
        >
          Annual Billing (Save 20%)
        </Button>
      </div>

      {/* Plan Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <Card key={plan.name} className={plan.highlighted ? 'ring-2 ring-primary shadow-lg' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <CardTitle>{plan.name}</CardTitle>
                <Badge variant={plan.badge === 'starter' ? 'secondary' : 'default'}>
                  {plan.badge}
                </Badge>
              </div>
              <CardDescription>
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {plan.price}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                  / {plan.period}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlighted ? 'default' : 'outline'}
                className="w-full"
              >
                {plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage Alert */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <AlertCircle className="w-5 h-5" />
            Approaching Capacity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
            You're using 64% of your team member limit. Consider upgrading to Professional or Enterprise to avoid disruption.
          </p>
          <Button variant="outline" size="sm">View Usage Details</Button>
        </CardContent>
      </Card>
    </div>
  );
}