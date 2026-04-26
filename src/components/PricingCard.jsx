import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PricingCard({ tier, isAnnual, onSelect, featured = false }) {
  if (!tier) return null;

  const price = isAnnual ? tier.annual_price : tier.monthly_price;
  const savings = isAnnual && tier.annual_price < (tier.monthly_price * 12) 
    ? Math.round((1 - tier.annual_price / (tier.monthly_price * 12)) * 100)
    : 0;

  return (
    <Card className={`relative flex flex-col h-full transition-all ${featured ? 'ring-2 ring-primary shadow-lg' : ''}`}>
      {featured && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
          Most Popular
        </Badge>
      )}

      <CardHeader>
        <CardTitle className="text-2xl">{tier.tier_name}</CardTitle>
        <CardDescription>{tier.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Pricing */}
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">£{price}</span>
            <span className="text-muted-foreground">/{isAnnual ? 'year' : 'month'}</span>
          </div>
          {savings > 0 && (
            <p className="text-sm text-green-600 mt-2">Save {savings}% on annual</p>
          )}
        </div>

        {/* Limits */}
        <div className="space-y-2 text-sm">
          {tier.max_cases && (
            <p><strong>{tier.max_cases}</strong> Cases</p>
          )}
          {tier.max_users && (
            <p><strong>{tier.max_users}</strong> Team Members</p>
          )}
          {tier.support_level && (
            <p><strong>{tier.support_level.charAt(0).toUpperCase() + tier.support_level.slice(1)}</strong> Support</p>
          )}
        </div>

        {/* Features */}
        <div className="space-y-3">
          {tier.features && Array.isArray(tier.features) && tier.features.map((feature, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button 
          onClick={() => onSelect?.(tier)}
          className="w-full mt-6"
          variant={featured ? 'default' : 'outline'}
          size="lg"
        >
          Get Started
        </Button>
      </CardContent>
    </Card>
  );
}