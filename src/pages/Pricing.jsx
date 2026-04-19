import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, X, Download, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';

const PRICING_TIERS = [
  {
    name: 'Solo Practitioner',
    price: 39,
    period: '/month',
    yearlyPrice: 468,
    description: 'Perfect for independent solicitors and barristers',
    badge: null,
    cta: 'Start Free Trial',
    features: {
      included: [
        'Single user license',
        'Up to 50 active cases',
        '50+ document templates',
        'Basic task & deadline tracking',
        'Email integration',
        'Mobile app (read-only)',
        'Community support'
      ],
      excluded: [
        'Team collaboration',
        'Client portal',
        'Time tracking & billing',
        'Advanced analytics',
        'Custom integrations',
        'Dedicated support'
      ]
    }
  },
  {
    name: 'Small Firm',
    price: 99,
    period: '/month',
    yearlyPrice: 1188,
    description: 'Most popular for small to mid-size teams',
    badge: 'Most Popular',
    cta: 'Start Free Trial',
    featured: true,
    features: {
      included: [
        'Up to 5 team members',
        'Unlimited active cases',
        'Advanced document automation',
        'Real-time collaboration & case notes',
        'Limited client portal',
        'Time tracking & billing integration',
        'Priority email support',
        'Compliance audit trail',
        'Custom workflows'
      ],
      excluded: [
        'Full client portal',
        'Custom integrations',
        'Advanced analytics',
        'White-label options',
        'Dedicated account manager',
        '24/7 phone support'
      ]
    }
  },
  {
    name: 'Enterprise',
    price: 299,
    period: '/month',
    yearlyPrice: 3588,
    description: 'For larger firms and corporate legal departments',
    badge: null,
    cta: 'Contact Sales',
    features: {
      included: [
        'Unlimited team members',
        'All Small Firm features',
        'Full client portal access',
        'Custom integrations (Salesforce, Xero, etc.)',
        'Advanced analytics & reporting',
        'White-label options',
        'Dedicated account manager',
        '24/7 phone support',
        'Custom SLAs',
        'Per-seat pricing available'
      ],
      excluded: []
    }
  }
];

const COMPARISON_DATA = [
  { category: 'Case Management', solo: true, small: true, enterprise: true },
  { category: 'Team Collaboration', solo: false, small: true, enterprise: true },
  { category: 'Document Automation', solo: 'Basic', small: 'Advanced', enterprise: 'Advanced' },
  { category: 'Client Portal', solo: false, small: 'Limited', enterprise: 'Full' },
  { category: 'Time Tracking & Billing', solo: false, small: true, enterprise: true },
  { category: 'Compliance Audit Trail', solo: false, small: true, enterprise: true },
  { category: 'Custom Workflows', solo: false, small: true, enterprise: true },
  { category: 'Analytics & Reporting', solo: false, small: 'Basic', enterprise: 'Advanced' },
  { category: 'Custom Integrations', solo: false, small: false, enterprise: true },
  { category: 'White-Label Options', solo: false, small: false, enterprise: true },
  { category: 'Dedicated Support', solo: false, small: false, enterprise: true }
];

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      const response = await base44.functions.invoke('generateProductSheet', {});
      
      // Create a blob from the response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Case-Tracker-Pro-Overview.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const getPrice = (tier) => {
    if (billingPeriod === 'annual') {
      return Math.floor(tier.yearlyPrice / 12);
    }
    return tier.price;
  };

  const getAnnualSavings = (tier) => {
    return tier.price * 12 - tier.yearlyPrice;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-16 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Case Tracker Pro Pricing</h1>
          <p className="text-xl text-slate-300 mb-8">Built by lawyers, for lawyers. Transparent pricing. No hidden fees.</p>
          
          {/* Billing Toggle */}
          <div className="flex justify-center items-center gap-4 mb-8">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-slate-900'
                  : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                billingPeriod === 'annual'
                  ? 'bg-white text-slate-900'
                  : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}
            >
              Annual <span className="text-xs ml-2 text-green-500">Save 20%</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {PRICING_TIERS.map((tier, idx) => (
            <div
              key={idx}
              className={`relative transform transition-all ${
                tier.featured ? 'md:scale-105 md:-translate-y-4' : ''
              }`}
            >
              {tier.badge && (
                <Badge className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4">
                  {tier.badge}
                </Badge>
              )}
              <Card className={`h-full ${tier.featured ? 'border-2 border-blue-500 shadow-xl' : 'border-slate-200'}`}>
                <CardHeader>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <p className="text-sm text-slate-600 mt-2">{tier.description}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">£{getPrice(tier)}</span>
                    <span className="text-slate-600">{tier.period}</span>
                  </div>
                  {billingPeriod === 'annual' && (
                    <p className="text-xs text-green-600 mt-2">Save £{getAnnualSavings(tier)}/year</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <Button
                    className={`w-full ${
                      tier.featured
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    {tier.cta}
                  </Button>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900">What's included:</h4>
                    <ul className="space-y-2">
                      {tier.features.included.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {tier.features.excluded.length > 0 && (
                    <div className="space-y-2 border-t pt-4">
                      <h4 className="font-semibold text-slate-900 text-sm">Not included:</h4>
                      <ul className="space-y-1">
                        {tier.features.excluded.slice(0, 3).map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                            <X className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <Card className="mb-16 bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl">Complete Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-4 px-4 font-semibold text-slate-900">Feature</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-900">Solo</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-900">Small Firm</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_DATA.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 text-slate-900 font-medium">{row.category}</td>
                      <td className="text-center py-4 px-4">
                        {row.solo === true ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                        ) : row.solo ? (
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">{row.solo}</span>
                        ) : (
                          <X className="w-5 h-5 text-slate-300 mx-auto" />
                        )}
                      </td>
                      <td className="text-center py-4 px-4">
                        {row.small === true ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                        ) : row.small ? (
                          <span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-700">{row.small}</span>
                        ) : (
                          <X className="w-5 h-5 text-slate-300 mx-auto" />
                        )}
                      </td>
                      <td className="text-center py-4 px-4">
                        {row.enterprise === true ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                        ) : row.enterprise ? (
                          <span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-700">{row.enterprise}</span>
                        ) : (
                          <X className="w-5 h-5 text-slate-300 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Why Choose Case Tracker Pro */}
        <Card className="mb-16 bg-gradient-to-br from-blue-50 to-slate-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-2xl">Why Choose Case Tracker Pro?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: '✓ Built by Lawyers',
                  desc: 'Purpose-built for UK legal practice – not a generic project tool adapted from the US'
                },
                {
                  title: '✓ Affordable from Day One',
                  desc: '£39/month for solo practitioners. Competitors start at £100+. No per-case fees.'
                },
                {
                  title: '✓ Deadline Intelligence',
                  desc: 'Never miss a limitation period again. Predictive warnings for court dates and compliance deadlines.'
                },
                {
                  title: '✓ AI-Powered Summaries',
                  desc: 'Auto-generate case notes, risk assessments, and legal precedent alerts in seconds.'
                },
                {
                  title: '✓ 10x Faster Documents',
                  desc: 'Auto-populate contracts & forms from case data. Saves 10+ hours/week per practitioner.'
                },
                {
                  title: '✓ RICS Compliance Ready',
                  desc: 'Built-in templates for conveyancing, property law, and probate. Audit trail for peace of mind.'
                },
                {
                  title: '✓ Easy Billing Sync',
                  desc: 'Seamless Xero/FreshBooks integration. Automatic invoice generation from tracked hours.'
                },
                {
                  title: '✓ Proven & Trusted',
                  desc: '500+ law firms rely on Case Tracker Pro. Real case studies. Real results.'
                },
                {
                  title: '✓ Scales with You',
                  desc: 'Start as a solo. Grow to 50+ practitioners. No migration headaches.'
                }
              ].map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="font-semibold text-slate-900">{item.title}</h4>
                  <p className="text-sm text-slate-700">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Download Product Sheet */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl">Download Our Product Sheet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-6">Get a comprehensive 1-page overview of Case Tracker Pro features, pricing, and competitive advantages.</p>
            <Button 
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              {downloadingPDF ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF (Case Tracker Pro Overview)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}