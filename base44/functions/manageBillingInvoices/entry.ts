import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, firm_email, tier_name, amount_gbp, billing_period_start, billing_period_end } = await req.json();

    if (action === 'create') {
      // Create new invoice
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      const invoice = await base44.entities.BillingInvoice.create({
        firm_email: firm_email || user.email,
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        billing_period_start: billing_period_start,
        billing_period_end: billing_period_end,
        tier_name: tier_name,
        amount_gbp: amount_gbp,
        status: 'sent',
        line_items: [
          {
            description: `${tier_name} Tier - Monthly Subscription`,
            quantity: 1,
            unit_price: amount_gbp,
            total: amount_gbp
          }
        ]
      });

      return Response.json({
        success: true,
        invoice_id: invoice.id,
        invoice_number: invoiceNumber,
        message: 'Invoice created successfully'
      });

    } else if (action === 'list') {
      // Get invoices for firm
      const invoices = await base44.entities.BillingInvoice.filter(
        { firm_email: firm_email || user.email }
      );

      return Response.json({
        success: true,
        invoices: invoices,
        total_count: invoices.length
      });

    } else if (action === 'mark_paid') {
      // Mark invoice as paid
      const { invoice_id } = await req.json();
      
      const updated = await base44.entities.BillingInvoice.update(invoice_id, {
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0]
      });

      return Response.json({
        success: true,
        invoice: updated
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[manageBillingInvoices]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});