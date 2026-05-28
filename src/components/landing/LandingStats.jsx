import React from 'react';

const stats = [
  { value: '85%', label: 'Settlement prediction accuracy', sub: 'vs 40% industry average' },
  { value: '12hrs', label: 'Average time saved per case', sub: 'on documentation alone' },
  { value: '£340M+', label: 'Settlement value managed', sub: 'across all cases on platform' },
  { value: '99.9%', label: 'Platform uptime SLA', sub: 'with UK-hosted infrastructure' },
];

const testimonials = [
  {
    quote: "CaseNarrative transformed how we handle professional negligence claims. What used to take days of document review now takes an hour.",
    author: "Senior Partner",
    firm: "North West Litigation Practice"
  },
  {
    quote: "The limitation date tracking alone has saved us from potential negligence. Every case manager should have this.",
    author: "Practice Manager",
    firm: "Regional Dispute Resolution Firm"
  },
  {
    quote: "The AI narratives are genuinely court-ready. We've used them directly in pre-action correspondence.",
    author: "Solicitor (5 PQE)",
    firm: "Manchester Employment & Civil Practice"
  }
];

export default function LandingStats() {
  return (
    <>
      {/* Stats bar */}
      <section className="bg-slate-900 py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <p className="text-4xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-slate-300 text-sm font-medium">{stat.label}</p>
              <p className="text-slate-500 text-xs mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Testimonials</p>
            <h2 className="text-3xl font-bold text-slate-900">What legal professionals say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-4 italic">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{t.author}</p>
                  <p className="text-slate-500 text-xs">{t.firm}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}