import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { document_type, company_name = 'CaseNarrative' } = await req.json();

    let content = '';

    if (document_type === 'terms_of_service') {
      content = `TERMS OF SERVICE

Last Updated: ${new Date().toLocaleDateString()}

1. ACCEPTANCE OF TERMS
By accessing and using ${company_name}, you accept and agree to be bound by the terms and provision of this agreement.

2. USE LICENSE
Permission is granted to temporarily download one copy of the materials (information or software) on ${company_name} for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
- Modify or copy the materials
- Use the materials for any commercial purpose or for any public display
- Attempt to decompile or reverse engineer any software contained on ${company_name}
- Remove any copyright or other proprietary notations from the materials
- Transfer the materials to another person or "mirror" the materials on any other server

3. DISCLAIMER
The materials on ${company_name}'s web site are provided on an 'as is' basis. ${company_name} makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.

4. LIMITATIONS
In no event shall ${company_name} or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on ${company_name}.

5. ACCURACY OF MATERIALS
The materials appearing on ${company_name} could include technical, typographical, or photographic errors. ${company_name} does not warrant that any of the materials on ${company_name} are accurate, complete, or current. ${company_name} may make changes to the materials contained on its web site at any time without notice.

6. LINKS
${company_name} has not reviewed all of the sites linked to its web site and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by ${company_name} of the site. Use of any such linked web site is at the user's own risk.

7. MODIFICATIONS
${company_name} may revise these terms of service for its web site at any time without notice. By using this web site, you are agreeing to be bound by the then current version of these terms of service.

8. GOVERNING LAW
These terms and conditions are governed by and construed in accordance with the laws of the United Kingdom, and you irrevocably submit to the exclusive jurisdiction of the courts located in England.`;

    } else if (document_type === 'privacy_policy') {
      content = `PRIVACY POLICY

Last Updated: ${new Date().toLocaleDateString()}

1. INTRODUCTION
${company_name} ("we" or "us" or "our") operates the website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.

2. INFORMATION COLLECTION AND USE
We collect several different types of information for various purposes to provide and improve our Service to you.

Types of Data Collected:
- Personal Data: Email address, name, company information
- Usage Data: IP address, browser type, pages visited, time spent
- Cookies: Small data files stored on your device

3. USE OF DATA
${company_name} uses the collected data for various purposes:
- To provide and maintain our Service
- To notify you about changes to our Service
- To provide customer support
- To gather analysis or valuable information to improve our Service
- To monitor the usage of our Service
- To detect, prevent and address technical issues

4. SECURITY OF DATA
The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.

5. CHANGES TO THIS PRIVACY POLICY
We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy.

6. CONTACT US
If you have any questions about this Privacy Policy, please contact us at legal@${company_name.toLowerCase().replace(/\s/g, '')}.com`;

    } else if (document_type === 'dpa') {
      content = `DATA PROCESSING AGREEMENT (DPA)

Last Updated: ${new Date().toLocaleDateString()}

This Data Processing Agreement ("DPA") is entered into between ${company_name} ("Processor") and the Client ("Controller").

1. DEFINITIONS
- Personal Data: Any information relating to an identified or identifiable natural person
- Processing: Any operation performed on Personal Data
- Data Subject: The individual to whom Personal Data relates

2. SCOPE
This DPA applies to all processing of Personal Data by the Processor on behalf of the Controller in connection with the provision of services.

3. SUBJECT MATTER AND DURATION
The subject matter, duration, nature, and purpose of processing are set out in the Service Agreement between the parties.

4. PROCESSOR OBLIGATIONS
The Processor shall:
- Process Personal Data only on documented instructions from the Controller
- Ensure that persons authorised to process Personal Data are committed to confidentiality
- Implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk
- Obtain prior specific or general written authorisation from the Controller before engaging any sub-processor

5. DATA SUBJECT RIGHTS
The Processor shall, taking into account the nature of processing, assist the Controller by appropriate technical and organisational measures in fulfilling the Controller's obligation to respond to Data Subject rights requests.

6. INTERNATIONAL DATA TRANSFERS
Any transfer of Personal Data outside the United Kingdom shall be subject to appropriate safeguards as required by applicable data protection law.

7. AUDIT AND INSPECTION
The Processor shall make available all information necessary to demonstrate compliance with this DPA and allow for audits and inspections by the Controller or the Controller's auditor.

8. DATA BREACH NOTIFICATION
The Processor shall notify the Controller without undue delay and in any event no later than 72 hours after becoming aware of a confirmed Personal Data breach.

9. DELETION OR RETURN OF DATA
Upon termination of services, the Processor shall, at the Controller's choice, delete or return all Personal Data and existing copies unless applicable law requires storage.

10. GOVERNING LAW
This DPA shall be governed by the laws of the United Kingdom.`;
    }

    if (!content) {
      return Response.json({ error: 'Invalid document type' }, { status: 400 });
    }

    // Generate PDF using jsPDF if needed, or return as text
    return Response.json({
      success: true,
      document_type: document_type,
      content: content,
      generated_date: new Date().toISOString(),
      note: 'Download as PDF or share with legal team for customisation before publication'
    });

  } catch (error) {
    console.error('[generateLegalDocuments]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});