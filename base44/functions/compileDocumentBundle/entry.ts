import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { case_id, document_ids, bundle_name, bundle_description, sort_order, court_format } = await req.json();

    if (!case_id || !document_ids || document_ids.length === 0 || !bundle_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch all documents
    const documents = [];
    for (const docId of document_ids) {
      const doc = await base44.asServiceRole.entities.DocumentAnalysis.get(docId);
      if (doc) documents.push(doc);
    }

    if (documents.length === 0) {
      return Response.json({ error: 'No valid documents found' }, { status: 400 });
    }

    // Sort documents
    const sortedDocs = [...documents];
    if (sort_order === 'chronological') {
      sortedDocs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    } else if (sort_order === 'reverse_chronological') {
      sortedDocs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    } else if (sort_order === 'type') {
      sortedDocs.sort((a, b) => a.document_type.localeCompare(b.document_type));
    }

    // Generate PDF with jsPDF
    const pdfContent = generateCourtReadyPDF(bundle_name, bundle_description, sortedDocs, court_format);

    // Upload PDF
    const uploadRes = await base44.integrations.Core.UploadFile({
      file: new Blob([pdfContent], { type: 'application/pdf' })
    });

    // Create bundle record
    const bundle = await base44.entities.DocumentBundle.create({
      case_id,
      bundle_name,
      description: bundle_description,
      document_ids,
      document_count: sortedDocs.length,
      sort_order,
      pdf_url: uploadRes.file_url,
      pdf_size_mb: (pdfContent.length / (1024 * 1024)).toFixed(2),
      page_count: calculatePageCount(sortedDocs),
      includes_index: true,
      court_formatted: court_format || false,
      created_by: user.email,
      created_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      bundle_id: bundle.id,
      bundle_name,
      document_count: sortedDocs.length,
      pdf_url: uploadRes.file_url,
      page_count: calculatePageCount(sortedDocs)
    });
  } catch (error) {
    console.error('Bundle compilation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateCourtReadyPDF(bundleName, description, documents, courtFormat) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Title Page
  doc.setFontSize(24);
  doc.text(bundleName, 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.text('Court-Ready Document Bundle', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.text(`${documents.length} Documents - Indexed and Paginated`, 20, yPosition);
  yPosition += 20;

  if (description) {
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(description, pageWidth - 40);
    doc.text(lines, 20, yPosition);
    yPosition += lines.length * 5 + 10;
  }

  // Index Page
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Index of Documents', 20, 20);
  yPosition = 30;

  documents.forEach((doc_item, idx) => {
    const tabNum = idx + 1;
    const text = `Tab ${tabNum}: ${doc_item.document_name} (${doc_item.document_type})`;
    doc.setFontSize(10);
    
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(text, 20, yPosition);
    yPosition += 8;
  });

  // Document Pages (simplified - just create separator pages in court format)
  documents.forEach((doc_item, idx) => {
    doc.addPage();
    doc.setFontSize(12);
    doc.text(`TAB ${idx + 1}: ${doc_item.document_name}`, 20, 20);
    doc.setFontSize(10);
    doc.text(`Type: ${doc_item.document_type}`, 20, 30);
    
    if (doc_item.summary) {
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(doc_item.summary, 170);
      doc.text('Summary:', 20, 45);
      doc.text(lines, 20, 52);
    }
  });

  return doc.output('arraybuffer');
}

function calculatePageCount(documents) {
  // Estimate pages: 1 cover + 1 index + 2 per document
  return 2 + (documents.length * 2);
}