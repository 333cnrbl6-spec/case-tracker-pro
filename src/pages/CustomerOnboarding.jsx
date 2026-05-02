import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRight, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function CustomerOnboarding() {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      title: 'Welcome',
      description: 'Get started with a 14-day free trial'
    },
    {
      number: 2,
      title: 'Company Details',
      description: 'Tell us about your firm'
    },
    {
      number: 3,
      title: 'Start Free Trial',
      description: 'Your trial is ready to use'
    }
  ];

  const handleStartTrial = async () => {
    if (!companyName.trim()) {
      toast.error('Please enter your company name');
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      
      // Create trial
      await base44.functions.invoke('handleTrialManagement', {
        action: 'create_trial',
        firm_email: user.email,
        trial_days: 14
      });

      // Send onboarding email
      await base44.functions.invoke('sendCustomerEmail', {
        recipient_email: user.email,
        email_type: 'onboarding_welcome',
        subject: 'Welcome to CaseNarrative - Your 14-Day Free Trial Starts Now',
        body: `Hi ${user.full_name},\n\nWelcome to CaseNarrative! Your 14-day free trial is now active.\n\nWhat you can do during your trial:\n- Create up to 3 legal cases\n- Invite 2 team members\n- Generate 5 AI narratives\n- Access basic compliance features\n\nYour trial expires in 14 days. To continue using CaseNarrative, upgrade to a paid plan.\n\nQuestions? Our support team is here to help.`
      });

      toast.success('Trial started! Check your email.');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      toast.error('Failed to start trial: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const StepContent = () => {
    if (step === 1) {
      return (
        <div className="space-y-6 py-8">
          <div className="text-center space-y-4">
            <Zap className="w-16 h-16 text-blue-600 mx-auto" />
            <h2 className="text-2xl font-bold">Welcome to CaseNarrative</h2>
            <p className="text-slate-600">The AI-powered legal case management platform</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3">
            <h3 className="font-semibold text-blue-900">Your 14-Day Free Trial Includes:</h3>
            <ul className="space-y-2">
              {[
                'Create up to 3 legal cases',
                'Invite 2 team members',
                'Generate 5 AI case narratives',
                'Basic compliance alerts',
                'Email support'
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-blue-800">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={() => setStep(2)} className="w-full bg-blue-600 hover:bg-blue-700">
            Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-6 py-8">
          <div>
            <label className="block text-sm font-medium mb-2">Company Name</label>
            <Input
              placeholder="e.g., Smith & Associates"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium">Practice Areas</label>
            <div className="grid grid-cols-2 gap-2">
              {['Personal Injury', 'Professional Negligence', 'Clinical Negligence', 'Conveyancing'].map(area => (
                <Badge key={area} variant="outline" className="cursor-pointer hover:bg-blue-50 py-2 justify-center">
                  {area}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button onClick={() => setStep(3)} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Continue
            </Button>
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-6 py-8">
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
            <h2 className="text-2xl font-bold">Trial Ready!</h2>
            <p className="text-slate-600">Your 14-day free trial is all set up</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-3">
            <h3 className="font-semibold text-green-900">Next Steps:</h3>
            <ol className="space-y-2 text-sm text-green-800">
              <li>1. Confirm your email address</li>
              <li>2. Create your first legal case</li>
              <li>3. Upload your evidence documents</li>
              <li>4. Generate your first AI case narrative</li>
            </ol>
          </div>

          <Button
            onClick={handleStartTrial}
            disabled={loading || !companyName}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Starting Trial...' : 'Activate Trial'}
          </Button>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Stepper */}
        <div className="mb-8 space-y-4">
          {steps.map((s) => (
            <div
              key={s.number}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                step === s.number
                  ? 'bg-blue-50 border border-blue-200'
                  : step > s.number
                  ? 'bg-green-50'
                  : 'bg-slate-50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step > s.number
                    ? 'bg-green-600 text-white'
                    : step === s.number
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {step > s.number ? '✓' : s.number}
              </div>
              <div>
                <p className="font-medium text-sm">{s.title}</p>
                <p className="text-xs text-slate-600">{s.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <Card>
          <CardContent>
            <StepContent />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}