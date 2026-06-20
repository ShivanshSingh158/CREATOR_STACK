import { jsPDF } from 'jspdf';

/**
 * generateContractPDF — generates a CreatorStack e-stamp contract PDF
 * using jsPDF. Mirrors the EStampContract component's content.
 */
export function generateContractPDF(params: {
  campaignId: string;
  campaignTitle: string;
  brandName: string;
  creatorName: string;
  deliverableType: string;
  productionDays: string | number;
  amount: string | number;
  brandSignedAt?: string;
  creatorSignatureName?: string;
  creatorSignedAt?: string;
  status?: string;
}) {
  const {
    campaignId,
    campaignTitle,
    brandName,
    creatorName,
    deliverableType,
    productionDays,
    amount,
    brandSignedAt,
    creatorSignatureName,
    creatorSignedAt,
  } = params;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;
  let y = 20;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const addText = (
    text: string,
    x: number,
    fontSize: number = 10,
    style: 'normal' | 'bold' = 'normal',
    maxWidth?: number,
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    if (maxWidth) {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      y += lines.length * (fontSize * 0.4);
    } else {
      doc.text(text, x, y);
      y += fontSize * 0.5;
    }
  };

  const addLine = () => {
    doc.setDrawColor(0, 0, 0);
    doc.line(marginL, y, pageW - marginR, y);
    y += 5;
  };

  const addSpacer = (h: number = 5) => {
    y += h;
  };

  const formatAmt = (n: string | number) => {
    const num = typeof n === 'string' ? parseInt(n.replace(/[^0-9]/g, '') || '0') : n;
    return `INR ${num.toLocaleString('en-IN')} (${numToWords(num)} Rupees)`;
  };

  // ── Header ───────────────────────────────────────────────────────────────
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(0, 0, pageW, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CREATORSTACK — DIGITAL ESCROW PLATFORM', marginL, 10);
  doc.text('CONFIDENTIAL · DO NOT DISTRIBUTE', pageW - marginR, 10, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  y = 25;

  // ── Title ─────────────────────────────────────────────────────────────────
  addText('E-STAMP CONTRACT', marginL, 18, 'bold');
  addText('Digital Service Agreement — Creator Marketing Campaign', marginL, 11, 'normal');
  addSpacer(2);
  addLine();

  // ── Reference Box ─────────────────────────────────────────────────────────
  const boxY = y;
  doc.setFillColor(248, 250, 252);
  doc.rect(marginL, boxY, contentW, 20, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.rect(marginL, boxY, contentW, 20);
  y = boxY + 5;
  addText(`Contract Ref: CS-${campaignId?.slice(-6).toUpperCase()}`, marginL + 3, 9, 'bold');
  addText(
    `Executed On: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    marginL + 3,
    9,
    'normal',
  );
  const statusY = y;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: ${(params.status || 'DRAFT').toUpperCase()}`, pageW - marginR - 30, statusY);
  y = boxY + 25;
  addSpacer(3);

  // ── Parties ────────────────────────────────────────────────────────────────
  addText('1. PARTIES TO THIS AGREEMENT', marginL, 12, 'bold');
  addSpacer(2);
  addText('ADVERTISER (Brand):', marginL, 10, 'bold');
  addText(brandName, marginL + 5, 10, 'normal');
  addSpacer(3);
  addText('SERVICE PROVIDER (Creator):', marginL, 10, 'bold');
  addText(creatorName, marginL + 5, 10, 'normal');
  addSpacer(5);
  addLine();

  // ── Deliverables ──────────────────────────────────────────────────────────
  addText('2. SCOPE OF SERVICES', marginL, 12, 'bold');
  addSpacer(2);
  addText(`Campaign Title: ${campaignTitle}`, marginL, 10, 'normal');
  addSpacer(3);
  addText(`Deliverable: ${deliverableType}`, marginL, 10, 'normal');
  addSpacer(3);
  addText(
    `Production Timeline: ${productionDays} calendar days from escrow lock date.`,
    marginL,
    10,
    'normal',
    contentW,
  );
  addSpacer(5);
  addLine();

  // ── Payment ────────────────────────────────────────────────────────────────
  addText('3. PAYMENT & ESCROW TERMS', marginL, 12, 'bold');
  addSpacer(2);
  addText(`Total Consideration: ${formatAmt(amount)}`, marginL, 10, 'bold');
  addSpacer(3);

  const grossAmt =
    typeof amount === 'string'
      ? parseInt(amount.replace(/[^0-9]/g, '') || '0')
      : (amount as number);
  const tds = Math.round(grossAmt * 0.1);
  const net = grossAmt - tds;
  const platformFee = Math.round(grossAmt * 0.08);

  addText(
    `TDS Deduction (10% u/s 194C): INR ${tds.toLocaleString('en-IN')}`,
    marginL + 5,
    9,
    'normal',
  );
  addText(
    `Platform Fee (8%): INR ${platformFee.toLocaleString('en-IN')}`,
    marginL + 5,
    9,
    'normal',
  );
  addText(`Net Payout to Creator: INR ${net.toLocaleString('en-IN')}`, marginL + 5, 10, 'bold');
  addSpacer(3);
  addText(
    "Payment is held in CreatorStack's regulated escrow account and released within 48 hours of brand approval of deliverables, or automatically released upon timer expiry.",
    marginL,
    9,
    'normal',
    contentW,
  );
  addSpacer(5);
  addLine();

  // ── Terms ──────────────────────────────────────────────────────────────────
  addText('4. KEY TERMS', marginL, 12, 'bold');
  addSpacer(2);
  const terms = [
    'Creator retains copyright of the content. Brand receives a 12-month non-exclusive license.',
    'Content must comply with ASCI guidelines and include #Ad disclosure.',
    'Brand may request one (1) round of revisions within 5 days of delivery.',
    "Disputes are resolved via CreatorStack's arbitration panel within 7 working days.",
    'TDS certificates (Form 16A) will be issued quarterly by CreatorStack.',
    'This agreement is governed by the laws of India, jurisdiction: Bangalore.',
  ];
  terms.forEach((t, i) => {
    addText(`${i + 1}. ${t}`, marginL + 3, 9, 'normal', contentW - 6);
    addSpacer(2);
  });
  addSpacer(3);
  addLine();

  // ── Signatures ────────────────────────────────────────────────────────────
  addText('5. SIGNATURES', marginL, 12, 'bold');
  addSpacer(5);

  const sigBoxW = (contentW - 10) / 2;
  const leftX = marginL;
  const rightX = marginL + sigBoxW + 10;

  // Brand sig box
  doc.setDrawColor(0);
  doc.rect(leftX, y, sigBoxW, 28);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ADVERTISER', leftX + 3, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(brandName, leftX + 3, y + 10);
  if (brandSignedAt) {
    doc.setFont('helvetica', 'bold');
    doc.text('✓ DIGITALLY SIGNED', leftX + 3, y + 17);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(brandSignedAt).toLocaleDateString('en-IN'), leftX + 3, y + 22);
  } else {
    doc.text('Signature: _______________', leftX + 3, y + 17);
    doc.text('Date: _______________', leftX + 3, y + 22);
  }

  // Creator sig box
  doc.rect(rightX, y, sigBoxW, 28);
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICE PROVIDER', rightX + 3, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(creatorName, rightX + 3, y + 10);
  if (creatorSignatureName && creatorSignedAt) {
    doc.setFont('helvetica', 'bold');
    doc.text('✓ DIGITALLY SIGNED', rightX + 3, y + 17);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${creatorSignatureName} · ${new Date(creatorSignedAt).toLocaleDateString('en-IN')}`,
      rightX + 3,
      y + 22,
    );
  } else {
    doc.text('Signature: _______________', rightX + 3, y + 17);
    doc.text('Date: _______________', rightX + 3, y + 22);
  }
  y += 35;

  // ── Footer ────────────────────────────────────────────────────────────────
  addLine();
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(
    'This is a digitally executed contract facilitated by CreatorStack (www.thecreatorstack.in). Escrow managed per RBI PPI guidelines.',
    marginL,
    y,
    { maxWidth: contentW },
  );

  // Save
  doc.save(`CreatorStack_Contract_${campaignId?.slice(-6).toUpperCase() || 'DRAFT'}.pdf`);
}

// ── Basic number to words (simplified for Indian numbering) ────────────────
function numToWords(n: number): string {
  if (n === 0) return 'Zero';
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const inWords = (num: number): string => {
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000)
      return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + inWords(num % 100) : '');
    if (num < 100000)
      return (
        inWords(Math.floor(num / 1000)) +
        ' Thousand' +
        (num % 1000 ? ' ' + inWords(num % 1000) : '')
      );
    if (num < 10000000)
      return (
        inWords(Math.floor(num / 100000)) +
        ' Lakh' +
        (num % 100000 ? ' ' + inWords(num % 100000) : '')
      );
    return (
      inWords(Math.floor(num / 10000000)) +
      ' Crore' +
      (num % 10000000 ? ' ' + inWords(num % 10000000) : '')
    );
  };

  return inWords(n);
}
