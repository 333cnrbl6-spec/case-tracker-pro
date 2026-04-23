import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { case_id, check_all } = body;

    // Fetch all communications and evidence for the case
    let communications = [];
    let evidence = [];

    if (case_id) {
      const allComms = await base44.entities.Communication.list();
      const allEvidance = await base44.entities.Evidence.list();
      
      communications = allComms.filter(c => 
        c.related_incidents && c.related_incidents.some(inc => 
          inc.includes(case_id) || case_id.includes(inc)
        )
      );
      
      evidence = allEvidance.filter(e => 
        e.related_incidents && e.related_incidents.some(inc => 
          inc.includes(case_id) || case_id.includes(inc)
        )
      );
    } else if (check_all) {
      communications = await base44.entities.Communication.list();
      evidence = await base44.entities.Evidence.list();
    }

    // Build email domain and person mapping from evidence
    const emailMapping = {};
    const suspiciousPatterns = [];

    communications.forEach(comm => {
      // Check for reply/reply-all patterns
      if (comm.subject && (comm.subject.includes('RE:') || comm.subject.includes('Fwd:'))) {
        // This is a reply - need to verify original sender isn't swapped
        suspiciousPatterns.push({
          id: comm.id,
          type: 'possible_reply_confusion',
          subject: comm.subject,
          from: comm.from,
          to: comm.to,
          date: comm.date,
          reason: 'Reply detected - verify sender/recipient not swapped in original thread'
        });
      }

      // Check for domain mismatches (e.g., powellandco email addresses)
      if (comm.from && comm.from.includes('@')) {
        const domain = comm.from.split('@')[1];
        const person = comm.from.split('@')[0];
        
        if (!emailMapping[domain]) emailMapping[domain] = new Set();
        emailMapping[domain].add(person);
      }
    });

    // Analyze evidence for sender verification issues
    const verificationIssues = [];

    communications.forEach(comm => {
      const issue = {
        id: comm.id,
        subject: comm.subject,
        from: comm.from,
        to: comm.to,
        date: comm.date,
        type: comm.type,
        flags: []
      };

      // Flag 1: Check for potential domain confusion
      if (comm.from && comm.from.includes('powellandco')) {
        issue.flags.push({
          type: 'domain_origin',
          message: 'Email from powellandco domain - verify if contractor using company email',
          suggestion: 'Check if sender is William Bradley using Powell & Co email address'
        });
      }

      // Flag 2: Check for missing or generic recipients
      if (!comm.to || comm.to.length === 0) {
        issue.flags.push({
          type: 'missing_recipient',
          message: 'Recipient information missing',
          suggestion: 'Review communication content to identify intended recipient'
        });
      }

      // Flag 3: Check for scope change language (common confusion pattern)
      if (comm.content && (comm.content.includes('scope') || comm.content.includes('outside the') || comm.content.includes('agreed'))) {
        issue.flags.push({
          type: 'scope_discussion',
          message: 'Scope-related discussion detected - verify sender/recipient roles',
          suggestion: 'Confirm who is raising the scope concern vs responding'
        });
      }

      if (issue.flags.length > 0) {
        verificationIssues.push(issue);
      }
    });

    // Prepare audit log entry
    const auditLog = await base44.asServiceRole.entities.AuditLog.create({
      event_type: 'workflow_triggered',
      action: `Sender/recipient accuracy verification initiated for ${communications.length} communications`,
      triggered_by: user.email,
      case_id,
      severity: 'medium',
      status: 'success',
      details: JSON.stringify({
        total_communications: communications.length,
        issues_found: verificationIssues.length,
        suspicious_patterns: suspiciousPatterns.length
      }),
      timestamp: new Date().toISOString()
    });

    return Response.json({
      verification_status: 'complete',
      total_communications_checked: communications.length,
      issues_found: verificationIssues.length,
      issues: verificationIssues,
      suspicious_patterns: suspiciousPatterns,
      email_domains_detected: Object.keys(emailMapping),
      audit_log_id: auditLog.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sender/recipient verification failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});