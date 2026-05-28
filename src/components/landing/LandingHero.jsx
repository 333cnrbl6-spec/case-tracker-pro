import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingHero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}/>
      
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full filter blur-3xl opacity-20 animate-pulse"/>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600 rounded-full filter blur-3xl opacity-15"/>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 grid lg:grid-cols-2 gap-16 items-center w-full">
        {/* Left content */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
            Trusted by UK litigation practices
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
            Win More Cases.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">In Less Time.</span>
          </h1>

          <p className="text-xl text-slate-300 leading-relaxed">
            AI-powered case management for dispute resolution, professional negligence, and personal injury practices. Settlement predictions, automated evidence analysis, and court-ready bundles — all in one platform.
          </p>

          <div className="flex flex-wrap gap-3">
            {['Settlement predictions', 'RICS compliance', 'AI legal briefs', 'Witness portal'].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button
              size="lg"
              onClick={() => navigate('/onboarding-trial')}
              className="bg-blue-600 hover:bg-blue-500 text-white text-base px-8 py-6 rounded-xl shadow-lg shadow-blue-900/40 gap-2"
            >
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-white/20 text-white hover:bg-white/10 text-base px-8 py-6 rounded-xl gap-2"
            >
              <Play className="w-4 h-4" /> See how it works
            </Button>
          </div>

          <p className="text-slate-400 text-sm">No credit card required · Full access for 6 months · SRA-compliant</p>
        </div>

        {/* Right: Dashboard preview mockup */}
        <div className="hidden lg:block">
          <div className="relative bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-2xl">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
              <div className="w-3 h-3 rounded-full bg-red-400/60"/>
              <div className="w-3 h-3 rounded-full bg-yellow-400/60"/>
              <div className="w-3 h-3 rounded-full bg-green-400/60"/>
              <div className="ml-4 flex-1 bg-white/10 rounded px-3 py-1 text-xs text-slate-400">app.casenarrative.co.uk/dashboard</div>
            </div>

            {/* Fake dashboard content */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Active Cases', value: '47', colour: 'text-blue-400' },
                  { label: 'Settlement Value', value: '£2.1M', colour: 'text-green-400' },
                  { label: 'Compliance Score', value: '94%', colour: 'text-purple-400' },
                ].map(card => (
                  <div key={card.label} className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-slate-400">{card.label}</p>
                    <p className={`text-xl font-bold mt-1 ${card.colour}`}>{card.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-3">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">AI Analysis Running</p>
                {['Breach of duty detected — s.13 Supply of Goods Act', 'Limitation date: 22 days remaining — ACTION REQUIRED', 'Settlement range: £185k – £240k (87% confidence)'].map((alert, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === 1 ? 'bg-red-400' : i === 2 ? 'bg-green-400' : 'bg-amber-400'}`}/>
                    <p className="text-xs text-slate-300">{alert}</p>
                  </div>
                ))}
              </div>

              <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-blue-300 font-semibold">AI Brief Ready</p>
                <p className="text-xs text-slate-400 mt-1">Jones v Bridgefield Surveyors Ltd — court-ready narrative generated</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}