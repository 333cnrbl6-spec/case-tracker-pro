import React from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, Users, FileText, Zap } from 'lucide-react';

export default function CustomerUsagePortal() {
  const { data: userMe } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => await base44.auth.me()
  });

  const { data: metersData } = useQuery({
    queryKey: ['userSubscription'],
    queryFn: async () => {
      const meters = await base44.asServiceRole.entities.SubscriptionMeters.filter({
        firm_email: userMe?.email
      });
      return meters[0];
    },
    enabled: !!userMe
  });

  const { data: tierData } = useQuery({
    queryKey: ['subscriptionTier'],
    queryFn: async () => {
      const tiers = await base44.asServiceRole.entities.SubscriptionTier.filter({
        tier_name: metersData?.subscription_tier
      });
      return tiers[0];
    },
    enabled: !!metersData
  });

  if (!metersData) return <div className="p-6">Loading...</div>;

  const metrics = [
    {
      icon: FileText,
      label: 'Cases',
      used: metersData.current_case_count || 0,
      limit: tierData?.max_cases,
      color: 'blue'
    },
    {
      icon: Users,
      label: 'Team Members',
      used: metersData.current_user_count || 1,
      limit: tierData?.max_users,
      color: 'purple'
    },
    {
      icon: Zap,
      label: 'AI Generations',
      used: metersData.ai_generations_this_month || 0,
      limit: tierData?.max_ai_generations,
      color: 'amber'
    },
    {
      icon: TrendingUp,
      label: 'Document Exports',
      used: metersData.document_exports_this_month || 0,
      limit: tierData?.max_document_exports,
      color: 'green'
    }
  ];

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Usage & Limits</h1>
        <p className="text-slate-600">See how you're using your {metersData.subscription_tier} plan</p>
      </div>

      {/* Usage Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const percentage = metric.limit > 0 ? (metric.used / metric.limit) * 100 : 0;
          const isWarning = percentage > 80;

          return (
            <Card key={metric.label} className={isWarning ? 'border-amber-200 bg-amber-50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 text-${metric.color}-600`} />
                    <CardTitle className="text-base">{metric.label}</CardTitle>
                  </div>
                  {isWarning && <AlertCircle className="w-5 h-5 text-amber-600" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{metric.used} of {metric.limit}</span>
                    <span className="text-sm text-slate-600">{Math.round(percentage)}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
                {isWarning && (
                  <p className="text-xs text-amber-700 bg-white rounded p-2">
                    You're using {percentage.toFixed(0)}% of your limit. Consider upgrading to continue.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upgrade Suggestion */}
      {metersData && (metersData.current_case_count > (tierData?.max_cases * 0.8) || metersData.ai_generations_this_month > (tierData?.max_ai_generations * 0.8)) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Ready to Upgrade?</CardTitle>
            <CardDescription className="text-blue-700">You're approaching your plan limits. Upgrade to get more:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✓ More cases and team members</li>
              <li>✓ Unlimited AI narrative generations</li>
              <li>✓ Priority support</li>
              <li>✓ Advanced compliance features</li>
            </ul>
            <Button className="bg-blue-600 hover:bg-blue-700">View Upgrade Options</Button>
          </CardContent>
        </Card>
      )}

      {/* Feature Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
          <CardDescription>What's included in your {metersData.subscription_tier} plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {tierData?.features?.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-green-600 text-lg">✓</span>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}