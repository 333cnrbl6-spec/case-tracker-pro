import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Shield, Zap, BarChart3, Users, Lock, Sparkles, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Legal Briefs',
      description: 'Generate comprehensive case narratives in seconds using advanced AI analysis'
    },
    {
      icon: Shield,
      title: 'RICS Compliance',
      description: 'Automated breach detection and compliance monitoring for surveyor conduct'
    },
    {
      icon: BarChart3,
      title: 'Evidence Analytics',
      description: 'Visual mapping, contradiction detection, and risk scoring for all documents'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Invite team members, share cases, and work together securely'
    },
    {
      icon: Lock,
      title: 'Enterprise Security',
      description: 'GDPR compliant, encrypted data, ISO 27001 certified infrastructure'
    },
    {
      icon: Zap,
      title: 'Fast & Intuitive',
      description: 'Streamlined workflows designed specifically for legal professionals'
    }
  ];

  const tiers = [
    { name: 'Free Trial', price: '£0', duration: '14 days', cta: 'Start Free' },
    { name: 'Starter', price: '£99', duration: '/month', cta: 'Upgrade' },
    { name: 'Professional', price: '£199', duration: '/month', cta: 'Upgrade' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-slate-900">CaseNarrative</div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate('/help')}>Help</Button>
            <Button variant="ghost" onClick={() => navigate('/pricing')}>Pricing</Button>
            <Button onClick={() => navigate('/onboarding-trial')} className="bg-blue-600 hover:bg-blue-700">
              Start Free Trial
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900">
            AI-Powered Legal Case Management
          </h1>
          <p className="text-xl text-slate-600">
            Generate AI-driven case narratives, analyze evidence, detect RICS breaches, and manage legal cases faster than ever.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate('/onboarding-trial')} className="bg-blue-600 hover:bg-blue-700 gap-2">
              Start 14-Day Free Trial <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/help')}>
              Learn More
            </Button>
          </div>
          <p className="text-sm text-slate-500">No credit card required. Access all features during your trial.</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features for Legal Teams</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 space-y-3">
                    <Icon className="w-8 h-8 text-blue-600" />
                    <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <Card key={tier.name} className={tier.name === 'Professional' ? 'ring-2 ring-blue-600 md:scale-105' : ''}>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg">{tier.name}</h3>
                  <div className="text-3xl font-bold">{tier.price} <span className="text-sm text-slate-600">{tier.duration}</span></div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">{tier.cta}</Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" size="lg" onClick={() => navigate('/pricing')}>
              View All Plans & Features
            </Button>
          </div>
        </div>
      </section>

      {/* Trust & Compliance */}
      <section className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Trusted by Legal Professionals</h2>
            <p className="text-slate-300 mb-8">GDPR compliant • ISO 27001 certified • UK data centers • Enterprise security</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border border-slate-700 rounded-lg">
              <Shield className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p className="text-sm">SOC 2 Type II</p>
            </div>
            <div className="p-4 border border-slate-700 rounded-lg">
              <Shield className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p className="text-sm">ISO 27001</p>
            </div>
            <div className="p-4 border border-slate-700 rounded-lg">
              <Lock className="w-8 h-8 mx-auto mb-2 text-blue-400" />
              <p className="text-sm">Cyber Insured</p>
            </div>
            <div className="p-4 border border-slate-700 rounded-lg">
              <Shield className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <p className="text-sm">UK Data Centers</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-blue-50">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Transform Your Casework?</h2>
          <p className="text-slate-600">Join legal teams using CaseNarrative to work smarter.</p>
          <Button size="lg" onClick={() => navigate('/onboarding-trial')} className="bg-blue-600 hover:bg-blue-700">
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-semibold mb-4">CaseNarrative</h3>
            <p className="text-sm">AI-powered legal case management for modern law firms.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm"><li><a href="/pricing" className="hover:text-white">Pricing</a></li><li><a href="/help" className="hover:text-white">Help</a></li></ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm"><li><a href="#" className="hover:text-white">Terms of Service</a></li><li><a href="#" className="hover:text-white">Privacy Policy</a></li><li><a href="#" className="hover:text-white">GDPR DPA</a></li></ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <p className="text-sm">support@casenarra.co.uk</p>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
          <p>&copy; 2026 CaseNarrative. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}