import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Colors
    const darkBlue = [30, 41, 82];
    const lightBlue = [59, 130, 246];
    const white = [255, 255, 255];
    const darkGray = [50, 50, 50];
    const lightGray = [240, 240, 240];

    // Page 1: Header & Hero
    doc.setFillColor(...darkBlue);
    doc.rect(0, 0, 210, 60, 'F');

    doc.setTextColor(...white);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('Case Tracker Pro', 15, 30);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Case Management Built by Lawyers, For Lawyers', 15, 40);

    // Tagline
    doc.setTextColor(...darkGray);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.text('Less admin. More billable hours. One platform.', 15, 55);

    // Section 1: Competitive Advantage
    let yPos = 70;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkBlue);
    doc.text('Why Case Tracker Pro Stands Out', 15, yPos);

    yPos += 12;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);

    const advantages = [
      '✓ Built for UK Legal Practice – Not adapted from US-centric platforms',
      '✓ Affordable from Day One – £39/month for solos (competitors start at £100+)',
      '✓ AI-Powered Automation – Case summaries, risk assessments, precedent alerts',
      '✓ Deadline Intelligence – Never miss a limitation period or court deadline',
      '✓ 10x Faster Documents – Auto-populate contracts/forms. Save 10+ hours/week',
      '✓ RICS Compliance Ready – Built-in templates for conveyancing, property, probate',
      '✓ Easy Billing Integration – Xero/FreshBooks sync. Auto-generated invoices',
      '✓ Proven by 500+ Law Firms – Real results, real case studies, real trust'
    ];

    advantages.forEach(adv => {
      doc.text(adv, 20, yPos);
      yPos += 8;
    });

    // Section 2: Pricing Tiers
    yPos += 4;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkBlue);
    doc.text('Transparent Pricing – Choose Your Plan', 15, yPos);

    yPos += 12;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Pricing boxes
    const tiers = [
      { name: 'SOLO', price: '£39/mo', users: '1 user', cases: '50 cases', color: [229, 231, 235] },
      { name: 'SMALL FIRM', price: '£99/mo', users: '5 users', cases: 'Unlimited', color: [219, 234, 254] },
      { name: 'ENTERPRISE', price: '£299/mo', users: 'Unlimited', cases: 'Unlimited', color: [191, 219, 254] }
    ];

    const tierWidth = 50;
    const tierSpacing = 5;

    tiers.forEach((tier, idx) => {
      const xPos = 15 + idx * (tierWidth + tierSpacing);
      
      doc.setFillColor(...tier.color);
      doc.rect(xPos, yPos, tierWidth, 25, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(xPos, yPos, tierWidth, 25);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...darkBlue);
      doc.text(tier.name, xPos + 5, yPos + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...lightBlue);
      doc.text(tier.price, xPos + 5, yPos + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...darkGray);
      doc.text(tier.users, xPos + 5, yPos + 17);
      doc.text(tier.cases, xPos + 5, yPos + 21);
    });

    yPos += 30;

    // Section 3: Key Features
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkBlue);
    doc.text('Core Features Available Across All Tiers', 15, yPos);

    yPos += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);

    const features = [
      'Case Management – Track unlimited cases with automated deadline tracking',
      'Document Automation – AI-powered templates save hours on drafting',
      'Compliance Audit Trail – Full transparency for RICS and legal compliance',
      'Mobile Access – Full case access on-the-go (iOS/Android)',
      'Client Portal – Limited or full access depending on tier',
      'Time & Billing Integration – Sync with Xero, FreshBooks, Sage'
    ];

    features.forEach(feature => {
      doc.text('• ' + feature, 18, yPos);
      yPos += 7;
    });

    // Section 4: Call to Action
    yPos += 4;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...white);
    doc.setFillColor(...lightBlue);
    doc.rect(15, yPos, 180, 12, 'F');
    doc.text('Start Your Free 14-Day Trial Today – No Credit Card Required', 20, yPos + 7);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Case Tracker Pro by SynergyFlow | www.synergyflow.io | hello@synergyflow.io', 105, 285, { align: 'center' });

    // Generate PDF
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Case-Tracker-Pro-Overview.pdf"'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});