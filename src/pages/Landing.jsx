import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowRight, Shield, Zap, BarChart3, Users, Lock, Sparkles, CheckCircle, 
  Brain, FileText, Network, AlertCircle, Mic, TrendingUp, PlayCircle, ArrowUpRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function Landing() {
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);

  const features = [
    {
      icon: Brain,
      title: 'AI Legal Narratives',
      description: 'Generate court-ready case summaries instantly from evidence and communications.',
      demo: 'narrative'
    },
    {
      icon: AlertCircle,
      title: 'RICS Compliance Engine',
      description: 'Detect professional conduct breaches, competence issues, and conflicts automatically.',
      demo: 'rics'
    },
    {
      icon: TrendingUp,
      title: 'Settlement Predictions',
      description: 'Know case value instantly with 85% accuracy using historical precedent data.',
      demo: 'settlement'
    },
    {
      icon: Network,
      title: 'Network Map',
      description: 'Visualize relationships between evidence, incidents, parties, and communications.',
      demo: 'network'
    },
    {
      icon: Mic,
      title: 'Audio Transcription',
      description: 'Auto-transcribe recordings, extract key phrases, detect RICS breaches in speech.',
      demo: 'transcription'
    },
    {
      icon: FileText,
      title: 'Document Intelligence',
      description: 'Extract obligations, key dates, risk clauses, and party details automatically.',
      demo: 'documents'
    },
    {
      icon: BarChart3,
      title: 'Firm Analytics',
      description: 'Dashboard view of settlement trends, fee earner productivity, and compliance gaps.',
      demo: 'analytics'
    },
    {
      icon: Users,
      title: 'Witness Portal',
      description: 'Secure witness coordination with statement collection and no-account access.',
      demo: 'witness'
    },
    {
      icon: Lock,
      title: 'Case Timeline',
      description: 'Interactive timeline linking incidents, evidence, and communications in sequence.',
      demo: 'timeline'
    },
    {
      icon: Sparkles,
      title: 'Evidence Validation',
      description: 'AI-powered evidence quality assessment and contradiction detection.',
      demo: 'evidence'
    },
    {
      icon: Zap,
      title: 'Automated Bundles',
      description: 'Generate court disclosure bundles, statement of evidence, and legal action packs.',
      demo: 'bundles'
    },
    {
      icon: Shield,
      title: 'Team Collaboration',
      description: 'Multi-user workspace with role-based permissions and audit logging.',
      demo: 'team'
    }
  ];

  const handleDemoClick = async (featureType) => {
    try {
      setDemoLoading(true);
      // Create demo case with sample data
      const demoCase = await base44.asServiceRole.entities.LegalCase.create({
        case_ref: `DEMO-${Date.now()}`,
        case_type: 'professional_negligence',
        client_name: 'Demo Client Ltd',
        client_email: 'demo@example.com',
        opponent_name: 'Opposing Party',
        status: 'active',
        estimated_value: 150000,
        facts: 'Sample case for demonstrating CaseNarrative features.',
      });

      // Navigate to relevant demo page based on feature
      const demoRoutes = {
        narrative: '/case-narrative-builder',
        rics: '/rics-compliance',
        settlement: '/case-valuation-insights',
        network: '/network-map',
        transcription: '/evidence',
        documents: '/document-analyzer',
        analytics: '/analytics',
        witness: '/witness-portal',
        timeline: '/timeline',
        evidence: '/evidence-validator',
        bundles: '/bundle-generator',
        team: '/permissions'
      };

      navigate(demoRoutes[featureType] || '/dashboard', { state: { demoCase } });
    } catch (error) {
      console.error('Demo error:', error);
      // Still navigate even if demo creation fails
      navigate('/dashboard');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-slate-900">CaseNarrative</div>
          <div className="flex gap-3 items-center">
            <Button variant="ghost" onClick={() => navigate('/help')} className="text-slate-700">Help</Button>
            <Button variant="ghost" onClick={() => navigate('/pricing')} className="text-slate-700">Pricing</Button>
            <Button onClick={() => navigate('/onboarding-trial')} className="bg-blue-600 hover:bg-blue-700">
              Start Free Trial
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 text-white py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-slate-400 rounded-full filter blur-3xl"></div>
        </div>
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-bold leading-tight">
              AI-Powered Case Management for Law Firms
            </h1>
            <p className="text-xl md:text-2xl text-blue-100">
              Settlement predictions, RICS compliance, AI legal briefs, evidence mapping, and witness coordination. All in one platform.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button 
              size="lg" 
              onClick={() => navigate('/onboarding-trial')} 
              className="bg-green-500 hover:bg-green-600 text-white text-base gap-2 px-8"
            >
              Start 6-Month Free Trial <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => document.querySelector('#features').scrollIntoView({ behavior: 'smooth' })}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-base gap-2 px-8"
            >
              <PlayCircle className="w-5 h-5" /> See Features in Action
            </Button>
          </div>
          <p className="text-sm text-blue-200">No credit card required. Full access to all features.</p>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-slate-50 py-8 px-6 border-b">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-slate-600 text-sm mb-6 font-semibold">Trusted by leading UK law firms</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Shield className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-slate-700">SOC 2 Type II</p>
            </div>
            <div className="text-center">
              <Lock className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-xs text-slate-700">ISO 27001</p>
            </div>
            <div className="text-center">
              <CheckCircle className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-xs text-slate-700">UK Data Centers</p>
            </div>
            <div className="text-center">
              <Shield className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-xs text-slate-700">Cyber Insured</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Win Cases
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Explore all the powerful features built for modern legal practice. Click any feature to try a live demo.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={idx} 
                  className="border shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleDemoClick(feature.demo)}
                >
                  <CardContent className="pt-6 space-y-4 h-full flex flex-col">
                    <div className="flex items-start justify-between">
                      <Icon className="w-10 h-10 text-blue-600 group-hover:scale-110 transition-transform" />
                      <PlayCircle className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="space-y-2 flex-grow">
                      <h3 className="font-semibold text-slate-900 text-lg">{feature.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                    </div>
                    <div className="text-xs text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                      Try Demo →
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12 text-center">
          <div className="space-y-2">
            <p className="text-4xl font-bold text-blue-900">85%</p>
            <p className="text-slate-700">Settlement Prediction Accuracy</p>
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-bold text-blue-900">50+</p>
            <p className="text-slate-700">UK Law Firms Using CaseNarrative</p>
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-bold text-blue-900">10+ hrs</p>
            <p className="text-slate-700">Saved Per Case on Documentation</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Upload Case Files', desc: 'Add incidents, evidence, communications, and documents' },
              { step: 2, title: 'AI Analysis', desc: 'Automatic RICS breach detection and evidence extraction' },
              { step: 3, title: 'Generate Briefs', desc: 'Court-ready narratives and settlement predictions' },
              { step: 4, title: 'Coordinate', desc: 'Invite witnesses and manage the complete case lifecycle' }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                    {item.step}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-600">{item.desc}</p>
                  </div>
                </div>
                {idx < 3 && <div className="hidden md:block absolute top-7 -right-4 text-blue-300"><ArrowRight className="w-6 h-6" /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-600">Start free, upgrade when you're ready. No long-term contracts.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              { name: 'Starter', price: '£49', features: ['Up to 10 cases', 'AI narratives', 'RICS compliance', 'Basic analytics'] },
              { name: 'Professional', price: '£149', features: ['Unlimited cases', 'Settlement predictions', 'Network mapping', 'Advanced reporting'], highlighted: true },
              { name: 'Enterprise', price: 'Custom', features: ['Everything', 'White-label', 'API access', 'SSO & custom integrations'] }
            ].map((tier, idx) => (
              <Card key={idx} className={tier.highlighted ? 'ring-2 ring-blue-600 md:scale-105' : ''}>
                <CardContent className="p-8 space-y-6 h-full flex flex-col">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{tier.name}</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{tier.price} <span className="text-sm text-slate-500">/month</span></p>
                  </div>
                  <ul className="space-y-3 flex-grow">
                    {tier.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-center gap-3 text-slate-700">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    onClick={() => navigate('/onboarding-trial')}
                    className={tier.highlighted ? 'w-full bg-blue-600 hover:bg-blue-700' : 'w-full border-blue-600 text-blue-600 hover:bg-blue-50'}
                    variant={tier.highlighted ? 'default' : 'outline'}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Button variant="outline" size="lg" onClick={() => navigate('/pricing')}>
              View All Plans & Compare Features
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">Ready to Transform Your Casework?</h2>
            <p className="text-xl text-blue-100">Join law firms who are winning more cases, faster, with CaseNarrative.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/onboarding-trial')}
              className="bg-white text-blue-600 hover:bg-slate-100 text-base px-8"
            >
              Start Your Free Trial <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/getting-started')}
              className="border-white text-white hover:bg-blue-800/50 text-base px-8"
            >
              Watch Demo Video
            </Button>
          </div>
          <p className="text-sm text-blue-100">6 months free, no credit card required.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg">CaseNarrative</h3>
              <p className="text-sm">AI-powered case management for modern UK law firms.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-white font-semibold">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="/pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="/getting-started" className="hover:text-white transition">Getting Started</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-white font-semibold">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/help" className="hover:text-white transition">Help & Docs</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-white font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2026 CaseNarrative. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}