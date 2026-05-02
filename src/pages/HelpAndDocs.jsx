import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronDown, Mail, MessageSquare, BookOpen } from 'lucide-react';

export default function HelpAndDocs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      question: 'How do I start my 14-day free trial?',
      answer: 'Go to the Pricing page and click "Start Free Trial". Complete the onboarding wizard with your company details and email verification. Your trial activates immediately.'
    },
    {
      id: 2,
      question: 'What happens when my trial expires?',
      answer: 'You\'ll receive email reminders 3 days before expiration. After expiration, you must upgrade to a paid plan to continue using CaseNarrative. You can pause or cancel anytime.'
    },
    {
      id: 3,
      question: 'Can I invite team members during my trial?',
      answer: 'Yes, the free trial includes 2 team member slots. Use Settings > Team to send invitations. Paid plans include more team members depending on your tier.'
    },
    {
      id: 4,
      question: 'How many AI narratives can I generate?',
      answer: 'Free trial: 5 per month. Starter: 25/month. Professional: 100/month. Enterprise: unlimited. Usage resets on your billing cycle date.'
    },
    {
      id: 5,
      question: 'Is my data secure?',
      answer: 'Yes. All data is encrypted in transit and at rest. We comply with GDPR, ISO 27001, and UK data protection laws. See our Privacy Policy for details.'
    },
    {
      id: 6,
      question: 'How do I export my cases?',
      answer: 'Use the Document Bundle Compiler to create PDF exports. Your tier determines export limits per month. Exports can be downloaded immediately.'
    },
    {
      id: 7,
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel anytime from your Billing Portal. Your access continues until the end of your current billing period.'
    },
    {
      id: 8,
      question: 'Do you offer discounts for annual billing?',
      answer: 'Yes! Annual plans offer 15% savings vs monthly billing. You can switch billing frequency anytime from your subscription settings.'
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-2 mb-2">
            <BookOpen className="w-8 h-8" />
            Help & Documentation
          </h1>
          <p className="text-slate-600">Find answers to common questions and learn how to use CaseNarrative.</p>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <div className="space-y-3 mb-8">
          {filteredFaqs.map((faq) => (
            <Card key={faq.id} className="cursor-pointer hover:border-blue-300 transition-colors">
              <button
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                className="w-full text-left p-6 flex items-center justify-between"
              >
                <span className="font-semibold text-slate-900">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform ${
                    expandedFaq === faq.id ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedFaq === faq.id && (
                <CardContent className="border-t pt-4 pb-6">
                  <p className="text-slate-700 leading-relaxed">{faq.answer}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {filteredFaqs.length === 0 && (
          <Card className="text-center py-8">
            <p className="text-slate-500">No results found. Try a different search.</p>
          </Card>
        )}

        {/* Contact Support */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Need More Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Email Support</p>
                  <p className="text-sm text-slate-600">support@casenarra.co.uk</p>
                  <p className="text-xs text-slate-500 mt-1">Response time: within 2 hours (business hours)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Live Chat</p>
                  <p className="text-sm text-slate-600">Chat with our team (bottom right corner)</p>
                  <p className="text-xs text-slate-500 mt-1">Available 9am-6pm GMT Monday-Friday</p>
                </div>
              </div>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
              <Mail className="w-4 h-4" />
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}