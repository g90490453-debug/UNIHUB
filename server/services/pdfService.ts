import PDFDocument from 'pdfkit';
import type { Response } from 'express';

export function streamPyqPdf(
  res: Response,
  paper: {
    title: string;
    paperCode: string;
    examYear: number;
    examSession: string;
    totalMarks: number;
    durationMinutes: number;
    universityName: string;
    programmeName: string;
    branchName: string;
    semesterName: string;
    subjectName: string;
    subjectCode: string;
    source: string;
    sectionsSummary?: string[];
    sampleQuestions?: string[];
  },
  disposition: 'inline' | 'attachment' = 'inline'
) {
  const filename = `${paper.paperCode || 'UNIHUB-PYQ'}-${paper.examYear}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  doc.fillColor('#0F172A').fontSize(18).text(paper.universityName.toUpperCase(), { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(12).fillColor('#334155').text(`${paper.programmeName} · ${paper.branchName} · ${paper.semesterName}`, { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(14).fillColor('#0F172A').text(`${paper.subjectCode}: ${paper.subjectName}`, { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#475569').text(
    `Paper Code: ${paper.paperCode}   |   Exam Year: ${paper.examYear} (${paper.examSession})   |   Time: ${Math.round(paper.durationMinutes / 60)} Hours   |   Max Marks: ${paper.totalMarks}`,
    { align: 'center' }
  );

  doc.moveDown(0.8);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#CBD5E1').stroke();
  doc.moveDown(0.8);

  doc.fontSize(10).fillColor('#0284C7').text('UNIHUB Verified Archive Document', { align: 'left' });
  doc.fontSize(9).fillColor('#64748B').text(`Source: ${paper.source}  |  Note: Attempt all sections as per university rubric.`);
  doc.moveDown(1);

  if (paper.sectionsSummary && paper.sectionsSummary.length > 0) {
    doc.fontSize(11).fillColor('#0F172A').text('Examination Structure');
    doc.moveDown(0.3);
    for (const sec of paper.sectionsSummary) {
      doc.fontSize(10).fillColor('#334155').text(`• ${sec}`);
      doc.moveDown(0.2);
    }
    doc.moveDown(0.8);
  }

  doc.fontSize(12).fillColor('#0F172A').text('Question Paper Items');
  doc.moveDown(0.5);

  const questions =
    paper.sampleQuestions && paper.sampleQuestions.length > 0
      ? paper.sampleQuestions
      : [
          'Q1. Define the core foundational concepts and explain asymptotic analysis with suitable examples. [10 Marks]',
          'Q2. Compare the architectural trade-offs and time complexities across standard implementations. [10 Marks]',
          'Q3. Solve the university case problem with step-by-step derivations and boundary conditions. [10 Marks]',
        ];

  questions.forEach((q, idx) => {
    doc.fontSize(10.5).fillColor('#1E293B').text(`${idx + 1}. ${q}`, { lineGap: 4 });
    doc.moveDown(0.7);
  });

  doc.moveDown(1.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E2E8F0').stroke();
  doc.moveDown(0.5);
  doc.fontSize(8.5).fillColor('#64748B').text(
    'Archived by UNIHUB Academic Platform · Educational & Examination Preparation Reference Only',
    { align: 'center' }
  );

  doc.end();
}

export function streamPaymentReceiptPdf(
  res: Response,
  receipt: {
    receiptNumber: string;
    issuedAt: string;
    studentName: string;
    studentEmail: string;
    universityName: string;
    packageName: string;
    semesterLabels: string[];
    basePriceInr: number;
    creditAppliedInr: number;
    finalAmountInr: number;
    paymentMethod: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    validUntil: string;
  }
) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="UNIHUB-Receipt-${receipt.receiptNumber}.pdf"`);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  doc.fillColor('#0F172A').fontSize(20).text('UNIHUB', { align: 'left' });
  doc.fontSize(10).fillColor('#475569').text('Your University. Your Semester. Your Preparation.');
  doc.moveDown(0.5);
  doc.fontSize(15).fillColor('#0284C7').text('PAYMENT RECEIPT & ENTITLEMENT CERTIFICATE');
  doc.moveDown(0.8);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#CBD5E1').stroke();
  doc.moveDown(0.8);

  const lines: Array<[string, string]> = [
    ['Receipt Number', receipt.receiptNumber],
    ['Issued Date', new Date(receipt.issuedAt).toLocaleString('en-IN')],
    ['Student Name', receipt.studentName],
    ['Student Email', receipt.studentEmail],
    ['University', receipt.universityName],
    ['Package', receipt.packageName],
    ['Covered Semesters', receipt.semesterLabels.join(', ') || 'Selected Semester'],
    ['Valid Until', new Date(receipt.validUntil).toLocaleDateString('en-IN')],
    ['Payment Method', receipt.paymentMethod.toUpperCase()],
    ['Order Reference', receipt.razorpayOrderId],
    ['Payment Reference', receipt.razorpayPaymentId],
  ];

  for (const [label, value] of lines) {
    doc.fontSize(10).fillColor('#64748B').text(`${label}:`, 50, doc.y, { continued: true, width: 170 });
    doc.fillColor('#0F172A').text(`  ${value}`);
    doc.moveDown(0.35);
  }

  doc.moveDown(0.8);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#CBD5E1').stroke();
  doc.moveDown(0.8);

  doc.fontSize(11).fillColor('#334155').text(`Base Package Price: INR ${receipt.basePriceInr.toFixed(2)}`);
  if (receipt.creditAppliedInr > 0) {
    doc.fontSize(11).fillColor('#059669').text(`Upgrade Credit Applied: - INR ${receipt.creditAppliedInr.toFixed(2)}`);
  }
  doc.moveDown(0.3);
  doc.fontSize(14).fillColor('#0F172A').text(`Total Paid: INR ${receipt.finalAmountInr.toFixed(2)}`);

  doc.moveDown(1.5);
  doc.fontSize(9).fillColor('#64748B').text(
    'This receipt confirms verified server-side payment authorization and active semester entitlement. No automatic renewal is enabled without explicit student consent.'
  );

  doc.end();
}
