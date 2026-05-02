import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Zap, Users, Shield, BookOpen } from 'lucide-react';

export default function GettingStartedGuide() {
  const [expandedStep, setExpandedStep] = useState(null);

  const steps = [
    {
      num: 1,
      title: 'Create Your Account',
      time: '1 min',
      description: 'Sign up with your firm email and choose a case template.',
      details: [
        'Visit casenarra.co.uk',
        'Click "Start Free Trial"',
        'Enter firm name and email',
        'Choose a template (or start blank)',
        'Confirm email'
      ]
    },
    {
      num: 2,
      title: 'Explore Your First Case',
      time: '3 mins',
      description: 'Get familiar with the case dashboard and key features.',
      details: [
        'Check the Timeline tab for incident progression',
        'Browse Evidence section to see documents',
        'Review RICS Assessment for compliance risk',
        'Look at Witnesses to see collaboration tools'
      ]
    },
    {
      num: 3,
      title: 'Add Incidents',
      time: '2 mins',
      description: 'Create the key events in your case timeline.',
      details: [
        'Go to Incidents tab',
        'Click "New Incident"',
        'Add date, title, and description',
        'Add 3-5 incidents for better AI analysis'
      ]
    },
    {
      num: 4,
      title: 'Upload Evidence',
      time: '2 mins',
      description: 'Add documents, emails, and reports.',
      details: [
        'Go to Evidence tab',
        'Click "Upload Document"',
        'Select PDF, image, or email',
        'CaseNarrative extracts text automatically'
      ]
    },
    {
      num: 5,
      title: 'Generate AI Narrative',
      time: '1 min',
      description: 'Get a court-ready case brief in seconds.',
      details: [
        'Go to Case Narrative tab',
        'Click "Generate AI Brief"',
        'Wait 30 seconds for analysis',
        'Download PDF or share with client'
      ]
    },
    {
      num: 6,
      title: 'Check RICS Compliance',
      time: '1 min',
      description: 'See breach probability and violations.',
      details: [
        'Go to RICS Assessment',
        'Review breach probability score',
        'Check identified violations',
        'Use to guide investigation strategy'
      ]
    }
  ];

  const features = [
    { icon: Zap, title: 'Settlement Predictions', desc: 'Know your case value in seconds' },
    { icon: BookOpen, title: 'AI Briefs', desc: 'Court-ready documents in minutes' },
    { icon: Shield, title: 'Compliance Monitoring', desc: 'Catch RICS breaches early' },
    { icon: Users, title: 'Witness Coordination', desc: 'Secure collaboration platform' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-4xl font-bold">Get Started in 10 Minutes</h1>
          <p className="text-xl text-blue-100">Everything you need to know to use CaseNarrative effectively</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        {/* Quick Steps */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-slate-900">6 Steps to Master CaseNarrative</h2>
          
          <div className="space-y-4">
            {steps.map((step) => (
              <Card 
                key={step.num}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setExpandedStep(expandedStep === step.num ? null : step.num)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                        {step.num}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{step.title}</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-semibold">{step.time}</span>
                    </div>
                  </div>
                </CardHeader>
                {expandedStep === step.num && (
                  <CardContent className="pt-0 pb-6">
                    <ul className="space-y-2 ml-16">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-slate-700">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <p className="text-center text-slate-600 text-sm">
            Click each step to see detailed instructions
          </p>
        </section>

        {/* Key Features */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-slate-900">Key Features You'll Love</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="bg-white hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <Icon className="w-8 h-8 text-blue-600 mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-slate-600">{feature.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Quick Tips */}
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-8 space-y-4">
          <h2 className="text-2xl font-bold text-blue-900">💡 Pro Tips</h2>
          
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <strong>Use Templates</strong>
                <p className="text-sm text-slate-600">Pre-populated example cases save 30 mins per case</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-2xl">📎</span>
              <div>
                <strong>Upload Communications</strong>
                <p className="text-sm text-slate-600">Email chains show breach patterns. Upload them.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <strong>Check Risk Alerts</strong>
                <p className="text-sm text-slate-600">Red banners mean compliance issues. Act on them.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-2xl">👥</span>
              <div>
                <strong>Share with Team</strong>
                <p className="text-sm text-slate-600">Invite team members to collaborate on cases</p>
              </div>
            </li>
          </ul>
        </section>

        {/* Common Workflows */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-slate-900">Common Workflows</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-green-600">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  Fast Valuation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">Get a settlement estimate in 5 minutes:</p>
                <ol className="text-sm space-y-2 list-decimal list-inside text-slate-700">
                  <li>Upload survey report</li>
                  <li>Add 2-3 key incidents</li>
                  <li>Click "Get Estimate"</li>
                  <li>Use for negotiation</li>
                </ol>
                <p className="text-xs text-green-600 font-semibold">Worth: £10K-50K in better deals</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Compliance Audit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">Catch breaches before they escalate:</p>
                <ol className="text-sm space-y-2 list-decimal list-inside text-slate-700">
                  <li>Add all incidents</li>
                  <li>Upload evidence</li>
                  <li>Review RICS score</li>
                  <li>Download report</li>
                </ol>
                <p className="text-xs text-blue-600 font-semibold">Prevents: Costly discipline</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-600">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  Court Docs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">Create court-ready briefs:</p>
                <ol className="text-sm space-y-2 list-decimal list-inside text-slate-700">
                  <li>Add all evidence</li>
                  <li>Generate narrative</li>
                  <li>Download PDF</li>
                  <li>Submit to court</li>
                </ol>
                <p className="text-xs text-purple-600 font-semibold">Saves: 4+ hours writing</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-12 text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100">Start your 14-day free trial now. No credit card required.</p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
            Start Free Trial
          </Button>
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-slate-900">Questions?</h2>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How long does settlement prediction take?</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600">
                30 seconds after you upload evidence. The more evidence you add, the more accurate it becomes.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I edit the AI narrative?</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600">
                Yes. Download the PDF and make any edits you need. The narrative is a starting point.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is my data secure?</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600">
                Yes. ISO 27001 certified, GDPR compliant, UK data centers, end-to-end encryption.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I share cases with my team?</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600">
                Yes. Go to Settings → Sharing and add team members by email. Control who can view/edit.
              </CardContent>
            </Card>
          </div>

          <div className="bg-slate-100 p-6 rounded-lg text-center">
            <p className="text-slate-700 mb-4">Still have questions?</p>
            <Button variant="outline">Contact Support</Button>
          </div>
        </section>
      </div>
    </div>
  );
}