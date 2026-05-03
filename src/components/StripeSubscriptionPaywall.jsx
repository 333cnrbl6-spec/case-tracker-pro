import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Lock, Zap, Crown, Building2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 59,
    icon: Zap,
    color: 'border-slate-300',
    badge: '',
    features: [
      '10 active cases',
      'Basic AI narrative generation',
      'Limitation date alerts',
      'Client care letter tracker',
      'Email support',
    ],
    limits: ['No Claude Sonnet AI', 'No PDF export suite', 'No precedent matching'],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 149,
    icon: Crown,
    color: 'border-indigo-500',
    badge: 'Most Popular',
    features: [
      'Unlimited cases',
      'Full AI suite (Claude Sonnet 4.6)',
      'All 4 AI narrative modes',
      'PDF export — all document types',
      'Precedent cross-referencing',
      'Evidence summarisation AI',
      'Correspondence drafting AI',
      '3 fee earner seats',
      'Compliance audit dashboard',
      'Priority support',
    ],
    limits: [],
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 349,
    icon: Building2,
    color: 'border-purple-500',
    badge: 'Full Firm',
    features: [
      'Everything in Professional',
      'Unlimited fee earner seats',
      'Court bundle automation',
      'White-label branding',
      'API access',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom integrations',
    ],
    limits: [],
  },
];

export function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900">Simple, Firm-Wide Pricing</h1>
          <p className="text-slate-600 mt-3 text-lg">One price for your whole firm. No per-seat surprises.</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2 text-sm text-green-800">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <strong>CaseNarrative at £149/mo</strong> vs Clio at £49–99/user/mo · LEAP at £100+/user/mo
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map(tier => {
            const Icon = tier.icon;
            return (
              <Card key={tier.id} className={`relative border-2 ${tier.color} ${tier.highlight ? 'shadow-xl scale-105' : ''}`}>
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-indigo-600 text-white px-3">{tier.badge}</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tier.highlight ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <CardTitle>{tier.name}</CardTitle>
                  </div>
                  <div>
                    <span className="text-4xl font-bold text-slate-900">£{tier.price}</span>
                    <span className="text-slate-500 text-sm">/month</span>
                  </div>
                  <p className="text-xs text-slate-400">Billed monthly · whole firm</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {tier.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-slate-700">{f}</span>
                      </div>
                    ))}
                    {tier.limits.map((l, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Lock className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                        <span className="text-slate-400">{l}</span>
                      </div>
                    ))}
                  </div>
                  <Button className={`w-full ${tier.highlight ? 'bg-indigo-600 hover:bg-indigo-700' : tier.id === 'enterprise' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-700 hover:bg-slate-800'}`}>
                    {tier.id === 'enterprise' ? 'Contact Sales' : `Start ${tier.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-sm text-slate-400 mt-8">
          14-day free trial · No credit card required · Cancel anytime
        </p>
      </div>
    </div>
  );
}

export function UpgradeModal({ feature, requiredTier = 'Professional', onClose }) {
  const tier = TIERS.find(t => t.id === requiredTier.toLowerCase()) || TIERS[1];
  const Icon = tier.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full border-2 border-indigo-300">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-indigo-900">Upgrade to {tier.name}</CardTitle>
              </div>
              <p className="text-sm text-slate-600">{feature} requires the {tier.name} plan.</p>
            </div>
            {onClose && <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
            <strong>Why CaseNarrative wins on value:</strong>
            <ul className="mt-1 space-y-0.5">
              <li>• Clio: £49–99 <em>per user</em> per month</li>
              <li>• LEAP: £100+ <em>per user</em> per month</li>
              <li>• <strong>CaseNarrative: £{tier.price}/mo for the whole firm</strong></li>
            </ul>
          </div>
          <div className="space-y-2">
            {tier.features.slice(0, 5).map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>{f}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Link to="/pricing" className="flex-1">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">View Plans</Button>
            </Link>
            {onClose && <Button variant="outline" onClick={onClose}>Maybe Later</Button>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function StripeSubscriptionPaywall({ children, feature, requiredTier = 'professional', userTier = 'starter' }) {
  const [showModal, setShowModal] = useState(false);

  const tierOrder = { starter: 0, professional: 1, enterprise: 2 };
  const normalizedUserTier = (userTier || '').toLowerCase();
  const normalizedRequiredTier = (requiredTier || '').toLowerCase();
  const hasAccess = (tierOrder[normalizedUserTier] || 0) >= (tierOrder[normalizedRequiredTier] || 1);

  if (hasAccess) return children;

  return (
    <>
      <div className="relative">
        <div className="opacity-50 pointer-events-none select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-lg"
          >
            <Lock className="w-4 h-4" /> Upgrade to unlock {feature}
          </button>
        </div>
      </div>
      {showModal && (
        <UpgradeModal
          feature={feature}
          requiredTier={requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}