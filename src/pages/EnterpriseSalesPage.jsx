import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Lock, Users, Zap, BarChart3, Shield } from 'lucide-react';

export default function EnterpriseSalesPage() {
  const features = [
    { icon: Zap, title: 'White-Label API', desc: 'Embed case valuation + AI narratives into your platform' },
    { icon: Users, title: 'Unlimited Team Members', desc: 'Manage unlimited users and witness collaborations' },
    { icon: BarChart3, title: 'Advanced Analytics', desc: 'Firm-wide RICS compliance dashboards and KPIs' },
    { icon: Shield, title: 'Enterprise Security', desc: 'SOC 2 Type II, ISO 27001, dedicated support' },
    { icon: Lock, title: 'Custom Integration', desc: 'Integrate with your existing legal software' },
    { icon: Users, title: 'Dedicated Account Manager', desc: '24/7 support from our enterprise team' }
  ];

  const complianceBadges = [
    { name: 'GDPR', icon: '🔐' },
    { name: 'ISO 27001', icon: '✓' },
    { name: 'SOC 2 Type II', icon: '🛡️' },
    { name: 'UK Data Center', icon: '🇬🇧' },
    { name: 'Cyber Insurance', icon: '💼' }
  ];

  const useCases = [
    {
      title: 'For Large Legal Practices',
      description: 'Manage 100+ cases with firm-wide RICS compliance monitoring and partner witness coordination.',
      icon: '🏢'
    },
    {
      title: 'For Law Tech Platforms',
      description: 'White-label our API to add case valuation and AI narrative generation to your software.',
      icon: '⚙️'
    },
    {
      title: 'For Insurance Firms',
      description: 'Assess RICS breach liability exposure and settlement risk across your claims portfolio.',
      icon: '📊'
    },
    {
      title: 'For Consulting Groups',
      description: 'Benchmark case outcomes and provide expert testimony with our settlement analytics.',
      icon: '📈'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge className="bg-blue-500/20 text-blue-200 px-4 py-1">Enterprise Solutions</Badge>
          
          <h1 className="text-5xl font-bold leading-tight">
            Enterprise-Grade Legal AI
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              For Ambitious Firms
            </span>
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            White-label API, unlimited users, dedicated support, and full RICS compliance automation. Built for firms handling 100+ cases.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8">
              Request Demo
            </Button>
            <Button size="lg" variant="outline" className="border-slate-500 text-white hover:bg-slate-800 px-8">
              Download Pitch Deck
            </Button>
          </div>

          {/* Compliance Badges */}
          <div className="flex justify-center gap-6 flex-wrap pt-8">
            {complianceBadges.map(badge => (
              <div key={badge.name} className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-lg">
                <span className="text-lg">{badge.icon}</span>
                <span className="text-sm font-semibold">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Enterprise Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="bg-slate-700 border-slate-600 hover:border-blue-500 transition-colors">
                  <CardHeader>
                    <Icon className="w-8 h-8 text-blue-400 mb-3" />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300">{feature.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Who Uses Enterprise</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {useCases.map((use, idx) => (
              <Card key={idx} className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <div className="text-4xl mb-2">{use.icon}</div>
                  <CardTitle>{use.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">{use.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16 bg-slate-800/50">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-bold">Custom Enterprise Pricing</h2>
          
          <Card className="bg-slate-700 border-blue-500 p-12">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-blue-400">Starts from £999/month</h3>
              <p className="text-slate-300 text-lg">
                Pricing depends on team size, case volume, and feature requirements.
              </p>
              <div className="space-y-3 text-left max-w-2xl mx-auto">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Unlimited cases, users, and AI generations</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>White-label API with revenue share options</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Dedicated account manager and 24/7 support</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Custom integrations and on-premises deployment</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>SLA guarantee and priority feature requests</span>
                </div>
              </div>
            </div>
          </Card>

          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8">
            Schedule Enterprise Demo
          </Button>
        </div>
      </section>

      {/* Contact */}
      <section className="px-6 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-bold">Ready to Scale?</h2>
          <p className="text-xl text-slate-300">
            Our enterprise team is ready to discuss your firm's specific needs and build a custom solution.
          </p>
          
          <div className="space-y-4">
            <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
              Request Enterprise Demo
            </Button>
            <a href="mailto:enterprise@casenarra.co.uk" className="block text-blue-400 hover:text-blue-300 underline">
              Or email: enterprise@casenarra.co.uk
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 px-6 py-8 text-center text-slate-400">
        <p>&copy; 2026 CaseNarrative Enterprise. All rights reserved.</p>
      </footer>
    </div>
  );
}