import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Lock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingCTA() {
  const navigate = useNavigate();

  return (
    <>
      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}/>
        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
            Ready to take your practice to the next level?
          </h2>
          <p className="text-xl text-blue-200">
            Join the UK's fastest growing legal AI platform. Start your free trial today — no credit card, no commitment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/onboarding-trial')}
              className="bg-white text-blue-700 hover:bg-blue-50 text-base px-10 py-6 rounded-xl font-semibold gap-2 shadow-xl"
            >
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/getting-started')}
              className="border-white/30 text-white hover:bg-white/10 text-base px-10 py-6 rounded-xl font-semibold"
            >
              View Documentation
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-300">
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> 6 months free</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> No credit card</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> SRA compliant</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Trust/compliance bar */}
      <section className="bg-white border-t py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-8">
          {[
            { icon: Shield, label: 'SOC 2 Type II', color: 'text-blue-600' },
            { icon: Lock, label: 'ISO 27001', color: 'text-green-600' },
            { icon: Shield, label: 'UK GDPR Compliant', color: 'text-purple-600' },
            { icon: Shield, label: 'UK Data Centres', color: 'text-amber-600' },
            { icon: Lock, label: 'Cyber Essentials Plus', color: 'text-red-600' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center gap-2 text-slate-600 text-sm">
                <Icon className={`w-4 h-4 ${item.color}`} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div className="space-y-3">
              <h3 className="text-white font-bold text-base">CaseNarrative</h3>
              <p className="text-sm leading-relaxed">AI-powered case management built for UK dispute resolution, professional negligence and personal injury practices.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-white font-semibold text-sm">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="/getting-started" className="hover:text-white transition">Getting Started</a></li>
                <li><a href="/enterprise" className="hover:text-white transition">Enterprise</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-white font-semibold text-sm">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/help" className="hover:text-white transition">Help & Docs</a></li>
                <li><a href="mailto:support@casenarrative.co.uk" className="hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition">System Status</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-white font-semibold text-sm">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">GDPR / DPA</a></li>
                <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-500">
            <p>© 2026 CaseNarrative Ltd. All rights reserved. Registered in England & Wales.</p>
            <p>support@casenarrative.co.uk</p>
          </div>
        </div>
      </footer>
    </>
  );
}