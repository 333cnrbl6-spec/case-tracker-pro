import React, { useState } from 'react';
import { Brain, AlertCircle, TrendingUp, Network, FileText, BarChart3, Users, Zap, Shield, Mic, Scale, Clock } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI Legal Narratives',
    description: 'Upload evidence and communications — get a structured, court-ready case brief in minutes, not hours.',
    tag: 'Most Popular',
    tagColor: 'bg-blue-100 text-blue-700',
    accent: 'blue'
  },
  {
    icon: TrendingUp,
    title: 'Settlement Predictions',
    description: '85% accuracy settlement range estimates built from UK case law precedents and your own case data.',
    tag: 'AI-Powered',
    tagColor: 'bg-green-100 text-green-700',
    accent: 'green'
  },
  {
    icon: AlertCircle,
    title: 'RICS Compliance Engine',
    description: 'Automatically detect professional conduct breaches, conflicts of interest, and competence failures.',
    tag: 'Compliance',
    tagColor: 'bg-amber-100 text-amber-700',
    accent: 'amber'
  },
  {
    icon: Clock,
    title: 'Limitation Date Tracker',
    description: 'Never miss a deadline. Critical date monitoring with escalating alerts across your entire caseload.',
    tag: 'Risk Management',
    tagColor: 'bg-red-100 text-red-700',
    accent: 'red'
  },
  {
    icon: Network,
    title: 'Relationship Network Map',
    description: 'Visualise connections between parties, evidence, incidents and communications as an interactive graph.',
    tag: 'Unique',
    tagColor: 'bg-purple-100 text-purple-700',
    accent: 'purple'
  },
  {
    icon: Zap,
    title: 'Automated Disclosure Bundles',
    description: 'One click to compile indexed, court-formatted document bundles with chronology and page numbering.',
    tag: 'Time Saving',
    tagColor: 'bg-cyan-100 text-cyan-700',
    accent: 'cyan'
  },
  {
    icon: FileText,
    title: 'Document Intelligence',
    description: 'Auto-extract obligations, key dates, risk clauses, and parties from any uploaded document.',
    accent: 'slate'
  },
  {
    icon: Mic,
    title: 'Audio Transcription',
    description: 'Transcribe recordings, extract key phrases, and auto-detect RICS breaches in spoken evidence.',
    accent: 'slate'
  },
  {
    icon: Users,
    title: 'Witness Portal',
    description: 'Invite witnesses securely via link. Collect signed statements. No account required for witnesses.',
    accent: 'slate'
  },
  {
    icon: BarChart3,
    title: 'Practice Analytics',
    description: 'Fee earner productivity, settlement trends, compliance gaps — all in one executive dashboard.',
    accent: 'slate'
  },
  {
    icon: Scale,
    title: 'Pre-Action Protocols',
    description: 'Guided workflows for professional negligence, PI, and dispute pre-action protocol compliance.',
    accent: 'slate'
  },
  {
    icon: Shield,
    title: 'Multi-Tenant Security',
    description: 'Role-based permissions, audit logs, 2FA, and complete matter isolation per firm user.',
    accent: 'slate'
  },
];

const accentMap = {
  blue: 'bg-blue-50 border-blue-200 group-hover:border-blue-400',
  green: 'bg-green-50 border-green-200 group-hover:border-green-400',
  amber: 'bg-amber-50 border-amber-200 group-hover:border-amber-400',
  red: 'bg-red-50 border-red-200 group-hover:border-red-400',
  purple: 'bg-purple-50 border-purple-200 group-hover:border-purple-400',
  cyan: 'bg-cyan-50 border-cyan-200 group-hover:border-cyan-400',
  slate: 'bg-white border-slate-200 group-hover:border-slate-300',
};

const iconAccentMap = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
  purple: 'text-purple-600',
  cyan: 'text-cyan-600',
  slate: 'text-slate-600',
};

export default function LandingFeatures() {
  return (
    <section id="features" className="py-24 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Platform Features</p>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900">
            Everything your practice needs,<br/>in one place
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Built specifically for UK dispute resolution, professional negligence, and personal injury practices.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className={`group border rounded-2xl p-6 transition-all duration-200 shadow-sm hover:shadow-md ${accentMap[feature.accent]}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-100`}>
                    <Icon className={`w-6 h-6 ${iconAccentMap[feature.accent]}`} />
                  </div>
                  {feature.tag && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${feature.tagColor}`}>
                      {feature.tag}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}