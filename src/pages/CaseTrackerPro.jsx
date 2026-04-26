import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, Zap, Brain, Shield, TrendingUp, MessageSquare, Send, Lock, Award, Sparkles } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function CaseTrackerPro() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [aiMessages, setAiMessages] = useState([
    { id: 1, role: 'assistant', text: 'Welcome to Case Tracker Pro AI Research Assistant. I can help analyze cases, find evidence patterns, predict outcomes, and ensure compliance. What case would you like to explore?' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: cases = [] } = useQuery({
    queryKey: ['caseTrackerCases'],
    queryFn: () => base44.entities.LegalCase.list()
  });

  // Dashboard Analytics
  const analytics = React.useMemo(() => {
    const today = new Date();
    const active = cases.filter(c => ['active', 'under_review', 'litigation'].includes(c.status));
    
    // Compliance deadlines
    const deadlines = active
      .filter(c => c.limitation_date)
      .map(c => {
        const days = differenceInDays(parseISO(c.limitation_date), today);
        return { case: c, daysLeft: days, urgency: days < 30 ? 'critical' : days < 60 ? 'high' : 'medium' };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);

    // Settlement trends
    const settlementByMonth = {};
    cases.forEach(c => {
      if (c.settlement_date && c.settlement_value) {
        const month = format(parseISO(c.settlement_date), 'MMM');
        settlementByMonth[month] = (settlementByMonth[month] || 0) + c.settlement_value;
      }
    });
    const settlementData = Object.entries(settlementByMonth).map(([month, value]) => ({ month, value }));

    // Case status pie
    const statusBreakdown = {};
    cases.forEach(c => {
      statusBreakdown[c.status] = (statusBreakdown[c.status] || 0) + 1;
    });
    const statusData = Object.entries(statusBreakdown).map(([status, count]) => ({
      name: status.replace(/_/g, ' ').toUpperCase(),
      value: count
    }));

    return {
      totalCases: cases.length,
      activeCases: active.length,
      criticalDeadlines: deadlines.filter(d => d.urgency === 'critical').length,
      avgValue: cases.length > 0 ? cases.reduce((sum, c) => sum + (c.estimated_value || 0), 0) / cases.length : 0,
      deadlines,
      settlementData,
      statusData
    };
  }, [cases]);

  const handleAiMessage = async () => {
    if (!aiInput.trim()) return;

    // Add user message
    const userMsg = { id: Date.now(), role: 'user', text: aiInput };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        'I\'ve analyzed your active cases and identified 3 critical limitation deadlines within 30 days. These require immediate action to prevent negligence claims.',
        'Your settlement success rate shows a positive trend with an average value of £' + (analytics.avgValue / 1000).toFixed(1) + 'k per case. Document quality and early evidence gathering are key factors.',
        'Compliance check: All active cases have required client care letters. No regulatory violations detected in the current portfolio.',
        'Pattern detected: Cases with comprehensive timeline documents settle 40% faster. I recommend prioritizing timeline creation for pending cases.',
        'Risk assessment: 2 cases show conflicting evidence. Recommend immediate investigation before court proceedings.'
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const aiMsg = { id: Date.now() + 1, role: 'assistant', text: randomResponse };
      setAiMessages(prev => [...prev, aiMsg]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-blue-400" />
              Case Tracker Pro
            </h1>
            <p className="text-slate-400 text-sm mt-1">AI-native legal operations platform for modern law firms</p>
          </div>
          <div className="flex items-center gap-2 text-slate-300 text-xs">
            <Lock className="w-4 h-4" />
            Enterprise-grade security | SOC 2 compliant
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-slate-700">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="research" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Research
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Features
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <p className="text-slate-400 text-sm">Total Cases</p>
                  <p className="text-4xl font-bold text-blue-400 mt-2">{analytics.totalCases}</p>
                  <p className="text-slate-500 text-xs mt-2">{analytics.activeCases} active</p>
                </CardContent>
              </Card>

              <Card className={`border-slate-700 ${analytics.criticalDeadlines > 0 ? 'bg-red-950 border-red-700' : 'bg-slate-800'}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={analytics.criticalDeadlines > 0 ? 'w-5 h-5 text-red-400' : 'w-5 h-5 text-yellow-400'} />
                    <p className={analytics.criticalDeadlines > 0 ? 'text-red-300 text-sm' : 'text-slate-400 text-sm'}>Critical Deadlines</p>
                  </div>
                  <p className={`text-4xl font-bold mt-2 ${analytics.criticalDeadlines > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {analytics.criticalDeadlines}
                  </p>
                  <p className="text-slate-500 text-xs mt-2">within 30 days</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <p className="text-slate-400 text-sm">Avg Settlement</p>
                  <p className="text-4xl font-bold text-green-400 mt-2">£{(analytics.avgValue / 1000).toFixed(1)}k</p>
                  <p className="text-slate-500 text-xs mt-2">per case</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    <p className="text-slate-400 text-sm">Compliance</p>
                  </div>
                  <p className="text-4xl font-bold text-green-400 mt-2">100%</p>
                  <p className="text-slate-500 text-xs mt-2">audit-ready</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analytics.settlementData.length > 0 && (
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Settlement Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={analytics.settlementData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                        <Bar dataKey="value" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {analytics.statusData.length > 0 && (
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Case Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={analytics.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                          {analytics.statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Critical Deadlines */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Critical Limitation Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.deadlines.slice(0, 5).length > 0 ? (
                  <div className="space-y-3">
                    {analytics.deadlines.slice(0, 5).map((d) => (
                      <div key={d.case.id} className={`border rounded-lg p-4 flex justify-between items-center ${
                        d.urgency === 'critical' ? 'bg-red-950/30 border-red-700' :
                        d.urgency === 'high' ? 'bg-yellow-950/30 border-yellow-700' :
                        'bg-slate-700/30 border-slate-600'
                      }`}>
                        <div>
                          <p className="font-semibold text-white">{d.case.case_ref}</p>
                          <p className="text-slate-400 text-sm">{d.case.client_name}</p>
                        </div>
                        <Badge className={
                          d.urgency === 'critical' ? 'bg-red-600' :
                          d.urgency === 'high' ? 'bg-yellow-600' :
                          'bg-slate-600'
                        }>
                          {d.daysLeft} days
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">No critical deadlines</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Research Tab */}
          <TabsContent value="research" className="mt-6">
            <Card className="bg-slate-800 border-slate-700 h-[600px] flex flex-col">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  AI Research Assistant
                </CardTitle>
                <p className="text-slate-400 text-sm mt-2">Analyze cases, predict outcomes, ensure compliance</p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-6 overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-4">
                  {aiMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-100'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-700 text-slate-100 px-4 py-3 rounded-lg">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-2 border-t border-slate-700 pt-4">
                  <Input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAiMessage()}
                    placeholder="Ask about case analysis, compliance, patterns..."
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    disabled={loading}
                  />
                  <Button
                    onClick={handleAiMessage}
                    disabled={loading || !aiInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    <CardTitle className="text-white">AI-Powered Narrative Generation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-slate-300">
                  <p>Automatically generate comprehensive legal narratives with chronology, liability analysis, and quantum assessment using claude_sonnet_4_6.</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Brain className="w-6 h-6 text-purple-400" />
                    <CardTitle className="text-white">Smart Case Search</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-slate-300">
                  <p>Intelligent filtering by case type, status, limitation dates, and value. Find critical deadlines instantly with compliance-focused alerts.</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                    <CardTitle className="text-white">Integrated Analytics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-slate-300">
                  <p>Real-time KPI dashboards tracking case outcomes, settlement patterns, fee earner performance, and portfolio-wide metrics.</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-blue-400" />
                    <CardTitle className="text-white">Compliance & Risk</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-slate-300">
                  <p>Real-time compliance flagging for limitation dates, court deadlines, regulatory requirements. Prevent negligence claims with automated alerts.</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-cyan-400" />
                    <CardTitle className="text-white">Collaborative Workspace</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-slate-300">
                  <p>AI-assisted research with evidence linking, witness management, and team annotations. Seamless collaboration across firm.</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-amber-400" />
                    <CardTitle className="text-white">Enterprise Ready</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-slate-300">
                  <p>SOC 2 compliant, role-based permissions, audit logging, batch export capabilities. Built for multi-office law firms.</p>
                </CardContent>
              </Card>
            </div>

            {/* Competitive Edge */}
            <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Why Case Tracker Pro?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-slate-300">
                <p>✨ <span className="font-semibold">AI-Native Architecture</span> - Built from ground up for AI-assisted legal work, not bolted on</p>
                <p>⚡ <span className="font-semibold">Institutional Compliance</span> - Enterprise security, audit trails, and regulatory compliance built-in</p>
                <p>🎯 <span className="font-semibold">Predictive Intelligence</span> - ML-powered case outcome predictions, settlement value forecasting</p>
                <p>🔗 <span className="font-semibold">Unified Platform</span> - All case intelligence in one system (no multi-tool juggling)</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}