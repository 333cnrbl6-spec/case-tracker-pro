import React from 'react';
import { Upload, Cpu, FileText, Send } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    step: '01',
    title: 'Upload your case materials',
    description: 'Add incidents, communications, evidence files, contracts, and photographs. Drag-and-drop or bulk import from any source.',
    detail: 'Supports PDF, Word, images, audio, video'
  },
  {
    icon: Cpu,
    step: '02',
    title: 'AI analyses everything',
    description: 'Our engine extracts key facts, detects RICS breaches, maps relationships, and calculates settlement ranges automatically.',
    detail: 'Results in under 60 seconds'
  },
  {
    icon: FileText,
    step: '03',
    title: 'Generate court-ready outputs',
    description: 'AI legal briefs, disclosure bundles, witness statements, solicitor letters — all formatted to court and protocol standards.',
    detail: 'Pre-action protocol compliant'
  },
  {
    icon: Send,
    step: '04',
    title: 'Collaborate and coordinate',
    description: 'Share updates with clients via secure portal, invite witnesses, assign tasks to fee earners, track milestones.',
    detail: 'Full audit trail included'
  }
];

export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Workflow</p>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900">From evidence to outcome</h2>
          <p className="text-xl text-slate-600">Four steps from raw case files to client-ready legal work.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="relative">
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-blue-300 to-slate-200 z-0" style={{ width: 'calc(100% - 3rem)', left: '4rem' }} />
                )}
                <div className="relative z-10 flex flex-col items-start space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-slate-900 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg leading-snug">{step.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
                  <span className="text-xs text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
                    {step.detail}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}