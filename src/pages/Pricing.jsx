import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import ProcessingFeedback from '@/components/ui/ProcessingFeedback';
import UnifiedPricingGrid from '@/components/UnifiedPricingGrid';
import PricingVotingBoard from '@/components/PricingVotingBoard';



export default function Pricing() {
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      const response = await base44.functions.invoke('generateProductSheet', {});
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'SynergyFlow-Pricing-Overview.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleTierSelect = async (tier) => {
    try {
      if (tier === 'Free') {
        // Redirect to free trial onboarding
        window.location.href = '/onboarding-trial';
      } else {
        // Initiate Stripe checkout
        const response = await base44.functions.invoke('createStripeCheckout', {
          tier_name: tier
        });
        if (response.data?.checkout_url) {
          window.location.href = response.data.checkout_url;
        }
      }
    } catch (error) {
      console.error('Error selecting tier:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-16 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">SynergyFlow Pricing</h1>
          <p className="text-xl text-slate-300">Unified pricing across the platform. Transparent. Flexible. Voted on by your team.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-16 space-y-16">
        {/* Active Voting Board */}
        <div>
          <h2 className="text-3xl font-bold mb-6 text-slate-900">Team Pricing Vote</h2>
          <PricingVotingBoard />
        </div>

        {/* Free Trial CTA */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-900">Start Free</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">Try CaseNarrative free for 14 days. No credit card required.</p>
            <Button 
              onClick={() => handleTierSelect('Free')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Start Your Free Trial
            </Button>
          </CardContent>
        </Card>

        {/* Unified Pricing Grid */}
        <div>
          <h2 className="text-3xl font-bold mb-6 text-slate-900">Choose Your Plan</h2>
          <UnifiedPricingGrid onSelect={handleTierSelect} />
        </div>

        {/* Download Product Sheet */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl">Download Our Pricing Sheet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">Get a comprehensive overview of SynergyFlow pricing and features across all tiers.</p>
            
            {downloadingPDF ? (
              <ProcessingFeedback
                label="Generating pricing sheet…"
                detail="Creating PDF with all tier details and features."
                tips={[
                  'This PDF includes all pricing tiers, features, and support levels.',
                  'You can save it for team review and share with partners.',
                  'Typical generation time is 10-30 seconds.'
                ]}
              />
            ) : (
              <Button 
                onClick={handleDownloadPDF}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <Download className="w-4 h-4" />
                Download Pricing Overview
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}