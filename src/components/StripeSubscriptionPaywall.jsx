import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Lock } from 'lucide-react';

const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 59,
    features: ['10 active cases', 'Basic AI narrative', 'Email support'],
    locked: ['PDF export', 'Precedent matching', 'Analytics dashboard', 'Multiple fee earners']
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 149,
    features: ['Unlimited cases', 'Full AI suite', 'PDF & court bundle export', 'Precedent matching', 'Analytics dashboard', 'Up to 3 fee earners', 'Priority support'],
    locked: [],
    recommended: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 349,
    features: ['Everything in Professional', 'Unlimited fee earners', 'Court bundle automation', 'Custom integrations', 'Dedicated support', 'SLA guarantee'],
    locked: []
  }
];

export default function StripeSubscriptionPaywall({ userTier = 'starter', feature = 'ai_narrative', onUpgrade }) {
  const [loading, setLoading] = useState(false);

  const canAccess = {
    ai_narrative: ['professional', 'enterprise'],
    precedent_matching: ['professional', 'enterprise'],
    pdf_export: ['professional', 'enterprise'],
    analytics: ['professional', 'enterprise'],
    court_bundle: ['enterprise']
  };

  const hasAccess = canAccess[feature]?.includes(userTier);

  const handleSubscribe = async (planId) => {
    try {
      setLoading(true);
      // In production, this would redirect to Stripe checkout
      // For now, we'll store the subscription preference
      await base44.auth.updateMe({ subscription_tier: planId });
      onUpgrade?.(planId);
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (hasAccess) {
    return null; // User has access, don't show paywall
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-96 overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="text-2xl">Upgrade Your Plan</CardTitle>
          <p className="text-blue-100 text-sm mt-2">Access to {feature.replace('_', ' ')} is included in Professional and above</p>
        </CardHeader>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`border-2 rounded-lg p-6 transition ${
                  plan.recommended
                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-slate-200'
                }`}
              >
                {plan.recommended && (
                  <Badge className="mb-4 bg-blue-600">Recommended</Badge>
                )}

                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">£{plan.price}</span>
                  <span className="text-slate-600">/month</span>
                </div>

                <div className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {plan.locked.length > 0 && (
                    <div className="border-t pt-2 mt-2">
                      {plan.locked.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-500">
                          <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading}
                  className={`w-full ${
                    plan.recommended
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-slate-600 hover:bg-slate-700'
                  }`}
                >
                  {loading ? 'Processing...' : `Upgrade to ${plan.name}`}
                </Button>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-slate-500 mt-6">
            All plans include 14-day free trial. Cancel anytime. No credit card required.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}