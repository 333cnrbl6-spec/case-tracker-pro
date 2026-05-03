import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import PricingCard from './PricingCard';

export default function UnifiedPricingGrid({ onSelect }) {
  const [isAnnual, setIsAnnual] = useState(false);

  // Fetch active pricing tiers
  const { data: tiers = [], isLoading, isError } = useQuery({
    queryKey: ['pricing-tiers-active'],
    queryFn: async () => {
      const result = await base44.entities.PricingTier.filter({ is_active: true });
      return result.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-slate-600">Loading pricing...</div>;
  }

  if (isError) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6 text-center">
          <p className="text-red-600">Failed to load pricing. Please refresh the page.</p>
        </CardContent>
      </Card>
    );
  }

  if (tiers.length === 0) {
    return (
      <Card className="bg-slate-50">
        <CardContent className="pt-6 text-center">
          <p className="text-slate-600">No pricing tiers available</p>
        </CardContent>
      </Card>
    );
  }

  const featuredTier = tiers.find(t => t.tier_name === 'Professional') || tiers[1];

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="flex justify-center items-center gap-4">
        <span className="text-sm font-medium text-slate-600">Monthly</span>
        <ToggleGroup 
          type="single" 
          value={isAnnual ? 'annual' : 'monthly'}
          onValueChange={(value) => setIsAnnual(value === 'annual')}
        >
          <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
          <ToggleGroupItem value="annual">Annual (Save up to 20%)</ToggleGroupItem>
        </ToggleGroup>
        <span className="text-sm font-medium text-slate-600">Annual</span>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            isAnnual={isAnnual}
            onSelect={onSelect}
            featured={tier.id === featuredTier.id}
          />
        ))}
      </div>

      {/* Comparison Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">Need Help Choosing?</CardTitle>
          <CardDescription>
            All tiers include core features. Higher tiers unlock advanced analytics, priority support, and unlimited cases.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="gap-2">
            Compare All Features
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}