import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Zap } from 'lucide-react';

export default function PartnerOnboarding() {
  const [step, setStep] = useState('overview'); // overview, inquiry, in_progress

  const partners = [
    {
      name: 'Clio',
      status: 'coming_soon',
      users: '50,000+',
      features: ['Case valuation API', 'AI narrative embedding', 'Risk scoring'],
      eta: 'June 2026'
    },
    {
      name: 'Rocket Matter',
      status: 'coming_soon',
      users: '20,000+',
      features: ['Case brief generation', 'Settlement predictions', 'Evidence analysis'],
      eta: 'June 2026'
    },
    {
      name: 'LawGility',
      status: 'planned',
      users: '15,000+',
      features: ['Case risk scoring', 'Compliance monitoring', 'Document automation'],
      eta: 'July 2026'
    },
    {
      name: 'HotDocs',
      status: 'planned',
      users: '100,000+',
      features: ['Template embedding', 'Narrative insertion', 'Auto-generation'],
      eta: 'August 2026'
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'coming_soon':
        return <Badge className="bg-blue-100 text-blue-800">Coming Soon</Badge>;
      case 'planned':
        return <Badge className="bg-slate-100 text-slate-800">Planned</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">White-Label Partnerships</h2>
        <p className="text-slate-600">
          CaseNarrative integrates with your favorite legal software platforms.
        </p>
      </div>

      {/* Overview */}
      {step === 'overview' && (
        <>
          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold flex-shrink-0">1</div>
                <div>
                  <p className="font-semibold">Your platform integrates our API</p>
                  <p className="text-sm text-slate-600">Get case valuation, AI narratives, and risk scoring</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold flex-shrink-0">2</div>
                <div>
                  <p className="font-semibold">Your users see new features automatically</p>
                  <p className="text-sm text-slate-600">No extra steps—integrated into their workflow</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold flex-shrink-0">3</div>
                <div>
                  <p className="font-semibold">You earn revenue share</p>
                  <p className="text-sm text-slate-600">20% on white-label transactions, no upfront cost</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                Available API Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="font-semibold text-sm mb-2">Case Valuation</p>
                  <p className="text-xs text-slate-600">Settlement predictions + confidence scores</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-semibold text-sm mb-2">AI Narratives</p>
                  <p className="text-xs text-slate-600">Auto-generate legal briefs + case summaries</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-semibold text-sm mb-2">Risk Scoring</p>
                  <p className="text-xs text-slate-600">RICS compliance analysis + breach detection</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partners */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Integration Pipeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {partners.map(p => (
                <Card key={p.name}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{p.name}</CardTitle>
                        <p className="text-xs text-slate-600 mt-1">{p.users} users</p>
                      </div>
                      {getStatusBadge(p.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">Features:</p>
                      <ul className="space-y-1">
                        {p.features.map(f => (
                          <li key={f} className="text-xs text-slate-700 flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 pt-2 border-t">
                      <Clock className="w-3 h-3" />
                      <span>Expected: {p.eta}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="font-semibold text-blue-900">Interested in partnership?</h3>
                <p className="text-sm text-blue-800">
                  Contact our partnerships team to discuss integration options and revenue share.
                </p>
                <Button
                  onClick={() => setStep('inquiry')}
                  className="bg-blue-600 hover:bg-blue-700 mx-auto"
                >
                  Contact Partnerships
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Inquiry Form */}
      {step === 'inquiry' && (
        <Card>
          <CardHeader>
            <CardTitle>Partnership Inquiry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Fill out this form and our team will contact you within 24 hours.
            </p>
            <div className="space-y-4">
              <Input placeholder="Your name" />
              <Input type="email" placeholder="Your email" />
              <Input placeholder="Your organization" />
              <textarea
                placeholder="Tell us about your platform and integration interest..."
                className="w-full p-3 border rounded-md text-sm"
                rows="4"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('overview')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep('in_progress')}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Submit Inquiry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {step === 'in_progress' && (
        <Card className="text-center py-8">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Inquiry Submitted!</h3>
          <p className="text-slate-600 mb-6">
            Our partnerships team will contact you within 24 hours to discuss next steps.
          </p>
          <Button onClick={() => setStep('overview')} variant="outline">
            Back to Overview
          </Button>
        </Card>
      )}
    </div>
  );
}