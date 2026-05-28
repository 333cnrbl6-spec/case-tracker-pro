import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const tiers = [
  {
    name: 'Starter',
    monthly: 49,
    annual: 39,
    description: 'For solo practitioners and small litigation teams',
    features: [
      'Up to 15 active cases',
      'AI legal narrative builder',
      'RICS compliance monitoring',
      'Basic evidence management',
      'Limitation date alerts',
      'Email support',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Professional',
    monthly: 149,
    annual: 119,
    description: 'For growing dispute resolution practices',
    features: [
      'Unlimited active cases',
      'Settlement prediction engine',
      'Network relationship mapping',
      'Document intelligence & OCR',
      'Disclosure bundle generator',
      'Client portal & witness coordination',
      'Practice analytics dashboard',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
    badge: 'Most Popular'
  },
  {
    name: 'Enterprise',
    monthly: null,
    annual: null,
    description: 'For multi-partner firms and chambers',
    features: [
      'Everything in Professional',
      'White-label branding',
      'API access & integrations',
      'SSO & advanced permissions',
      'Custom case templates',
      'Dedicated account manager',
      'SLA & compliance support',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  }
];

export default function LandingPricing() {
  const [annual, setAnnual] = useState(false);
  const navigate = useNavigate();

  const handleCta = (tier) => {
    if (tier.name === 'Enterprise') {
      window.location.href = 'mailto:sales@casenarrative.co.uk?subject=Enterprise Enquiry';
    } else {
      navigate('/onboarding-trial');
    }
  };

  return (
    <section id="pricing" className="py-24 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Pricing</p>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900">Simple, transparent pricing</h2>
          <p className="text-xl text-slate-600">Start free for 6 months. No credit card, no contracts.</p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <span className={`text-sm font-medium ${!annual ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-7' : 'translate-x-1'}`}/>
            </button>
            <span className={`text-sm font-medium ${annual ? 'text-slate-900' : 'text-slate-400'}`}>
              Annual <span className="text-green-600 font-semibold ml-1">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-8 flex flex-col ${
                tier.highlighted
                  ? 'bg-blue-600 text-white shadow-2xl shadow-blue-200 scale-105'
                  : 'bg-white border border-slate-200 shadow-sm'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {tier.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-xl font-bold mb-1 ${tier.highlighted ? 'text-white' : 'text-slate-900'}`}>{tier.name}</h3>
                <p className={`text-sm ${tier.highlighted ? 'text-blue-200' : 'text-slate-500'}`}>{tier.description}</p>
              </div>

              <div className="mb-6">
                {tier.monthly ? (
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${tier.highlighted ? 'text-white' : 'text-slate-900'}`}>
                      £{annual ? tier.annual : tier.monthly}
                    </span>
                    <span className={`text-sm ${tier.highlighted ? 'text-blue-200' : 'text-slate-500'}`}>/month</span>
                  </div>
                ) : (
                  <span className={`text-3xl font-bold ${tier.highlighted ? 'text-white' : 'text-slate-900'}`}>Custom</span>
                )}
              </div>

              <ul className="space-y-3 flex-grow mb-8">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.highlighted ? 'text-blue-200' : 'text-green-500'}`} />
                    <span className={`text-sm ${tier.highlighted ? 'text-blue-100' : 'text-slate-600'}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleCta(tier)}
                className={`w-full py-6 text-base font-semibold rounded-xl ${
                  tier.highlighted
                    ? 'bg-white text-blue-600 hover:bg-blue-50'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-500 text-sm mt-8">All plans include a 6-month free trial. VAT may apply.</p>
      </div>
    </section>
  );
}