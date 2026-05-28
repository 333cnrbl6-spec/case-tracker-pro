import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Scale } from 'lucide-react';

export default function LandingNav() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <span className={`text-xl font-bold ${scrolled ? 'text-slate-900' : 'text-white'}`}>CaseNarrative</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className={`text-sm font-medium hover:opacity-70 transition ${scrolled ? 'text-slate-700' : 'text-white/90'}`}>Features</a>
          <a href="#how-it-works" className={`text-sm font-medium hover:opacity-70 transition ${scrolled ? 'text-slate-700' : 'text-white/90'}`}>How it works</a>
          <a href="#pricing" className={`text-sm font-medium hover:opacity-70 transition ${scrolled ? 'text-slate-700' : 'text-white/90'}`}>Pricing</a>
          <a href="/help" className={`text-sm font-medium hover:opacity-70 transition ${scrolled ? 'text-slate-700' : 'text-white/90'}`}>Help</a>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className={scrolled ? 'text-slate-700' : 'text-white hover:bg-white/10'}
          >
            Sign In
          </Button>
          <Button 
            onClick={() => navigate('/onboarding-trial')}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            Start Free Trial
          </Button>
        </div>
      </div>
    </nav>
  );
}