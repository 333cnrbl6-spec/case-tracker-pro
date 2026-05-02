import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({
        error: 'Only admins can view telemetry'
      }, { status: 403 });
    }

    // Get all subscription meters for firm analytics
    const allMeters = await base44.asServiceRole.entities.SubscriptionMeters.list();
    
    // Get audit logs
    const auditLogs = await base44.asServiceRole.entities.AuditLog.list();

    // Calculate metrics
    const totalSubscriptions = allMeters.length;
    const activeSubscriptions = allMeters.filter(m => m.subscription_active).length;
    const totalMRR = allMeters.reduce((sum, m) => {
      // Simplified MRR calculation
      return sum + (m.subscription_tier === 'Starter' ? 99 : m.subscription_tier === 'Professional' ? 199 : m.subscription_tier === 'Premium' ? 399 : 0);
    }, 0);

    // Feature usage
    const totalCases = allMeters.reduce((sum, m) => sum + (m.current_case_count || 0), 0);
    const totalUsers = allMeters.reduce((sum, m) => sum + (m.current_user_count || 1), 0);
    const totalAIGenerations = allMeters.reduce((sum, m) => sum + (m.ai_generations_this_month || 0), 0);
    const totalExports = allMeters.reduce((sum, m) => sum + (m.document_exports_this_month || 0), 0);

    // Churn rate (inactive subscriptions)
    const churnRate = totalSubscriptions > 0 
      ? ((totalSubscriptions - activeSubscriptions) / totalSubscriptions * 100).toFixed(2)
      : 0;

    const telemetry = {
      timestamp: new Date().toISOString(),
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        churn_rate_percent: parseFloat(churnRate)
      },
      revenue: {
        monthly_recurring_revenue: totalMRR,
        currency: 'GBP'
      },
      features: {
        total_cases: totalCases,
        total_users: totalUsers,
        ai_generations_month: totalAIGenerations,
        document_exports_month: totalExports
      },
      audit_events: auditLogs.length,
      period: 'current_billing_cycle'
    };

    return Response.json({ success: true, telemetry });
  } catch (error) {
    console.error('[generateSaaSTelemetry]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});