import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setError('No verification token provided');
        return;
      }

      try {
        await base44.functions.invoke('verifyEmail', { token });
        setStatus('success');
        toast.success('Email verified! Activating your trial...');
        setTimeout(() => navigate('/onboarding-trial'), 2000);
      } catch (err) {
        setStatus('error');
        setError(err.response?.data?.error || 'Verification failed');
      }
    };

    verify();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'verifying' && (
            <>
              <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
              <p className="text-slate-600">Verifying your email...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
              <div>
                <p className="font-semibold text-green-900">Email Verified!</p>
                <p className="text-sm text-green-700 mt-1">Redirecting to your trial...</p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
              <div>
                <p className="font-semibold text-red-900">Verification Failed</p>
                <p className="text-sm text-red-700 mt-2">{error}</p>
              </div>
              <Button onClick={() => navigate('/onboarding-trial')} className="w-full mt-4">
                Back to Signup
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}