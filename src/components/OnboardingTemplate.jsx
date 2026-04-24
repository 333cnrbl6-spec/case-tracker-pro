import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function OnboardingTemplate({ step, title, description, children, onNext, onSkip, progress }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        {progress && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              {[...Array(progress.total)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    i < progress.current
                      ? 'bg-primary'
                      : i === progress.current
                      ? 'bg-primary/50'
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Step {progress.current + 1} of {progress.total}
            </p>
          </div>
        )}

        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-primary to-secondary text-white rounded-t-xl">
            <CardTitle className="text-3xl">{title}</CardTitle>
            <p className="text-blue-100 mt-2">{description}</p>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            {children}
            <div className="flex gap-3 justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              {onSkip && (
                <Button variant="outline" onClick={onSkip}>
                  Skip for now
                </Button>
              )}
              <Button onClick={onNext} className="gap-2 ml-auto">
                {progress?.current === progress?.total - 1 ? (
                  <>
                    <CheckCircle className="w-4 h-4" /> Complete Setup
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}