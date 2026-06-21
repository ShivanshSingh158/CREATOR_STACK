import { jsPDF } from 'jspdf';

/**
 * generateMediaKitPDF — generates a CreatorStack Media Kit PDF
 * using jsPDF. Highlights creator's stats, niche, and past brands.
 */
export function generateMediaKitPDF(creator: any) {
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
    color: [number, number, number] = [0, 0, 0],
    maxWidth?: number,
  ) => {
    doc.setTextColor(...color);
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
    doc.setLineWidth(0.5);
    doc.line(marginL, y, pageW - marginR, y);
    y += 5;
  };

  const addSpacer = (h: number = 5) => {
    y += h;
  };

  // ── Header (Neobrutalist Style) ──────────────────────────────────────────
  doc.setFillColor(232, 71, 63); // Creator Red (#e8473f)
  doc.rect(0, 0, pageW, 25, 'F');
  
  // Header shadow accent
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 25, pageW, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CREATORSTACK — VERIFIED MEDIA KIT', marginL, 15);
  
  doc.setTextColor(0, 0, 0);
  y = 40;

  // ── Creator Name & Title ──────────────────────────────────────────────────
  addText((creator?.name || creator?.legalName || 'Creator Profile').toUpperCase(), marginL, 24, 'bold', [0, 0, 0]);
  addText(creator?.handle ? `@${creator.handle}` : 'Professional Content Creator', marginL, 12, 'normal', [100, 100, 100]);
  addSpacer(8);
  addLine();
  addSpacer(5);

  // ── Stats Box ─────────────────────────────────────────────────────────────
  const statsY = y;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.rect(marginL, statsY, contentW, 25, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(marginL, statsY, contentW, 25);
  // Add neobrutalist shadow
  doc.setFillColor(0, 0, 0);
  doc.rect(marginL + 2, statsY + 2, contentW, 25, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(marginL, statsY, contentW, 25, 'F');
  doc.rect(marginL, statsY, contentW, 25);

  const colW = contentW / 3;
  
  // Stat 1
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(232, 71, 63);
  doc.text((creator?.youtubeFollowers || '10K+').toLocaleString(), marginL + 5, statsY + 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('TOTAL SUBSCRIBERS', marginL + 5, statsY + 18);

  // Stat 2
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(232, 71, 63);
  doc.text((creator?.averageViews || '50K+').toLocaleString(), marginL + colW + 5, statsY + 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('AVG. VIEWS (30 DAYS)', marginL + colW + 5, statsY + 18);

  // Stat 3
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const baseRate = creator?.baseRate ? `INR ${parseInt(creator.baseRate).toLocaleString('en-IN')}` : 'Variable';
  doc.text(baseRate, marginL + (colW * 2) + 5, statsY + 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('BASE RATE', marginL + (colW * 2) + 5, statsY + 18);

  y = statsY + 35;
  addSpacer(5);

  // ── Profile Details ────────────────────────────────────────────────────────
  addText('AUDIENCE & NICHE', marginL, 14, 'bold', [0, 0, 0]);
  addSpacer(3);
  
  addText('Primary Niche:', marginL, 10, 'bold');
  addText(creator?.niche || 'Lifestyle & Entertainment', marginL + 35, 10, 'normal');
  addSpacer(2);
  
  addText('Content Language:', marginL, 10, 'bold');
  addText(creator?.language || 'English / Hindi', marginL + 35, 10, 'normal');
  addSpacer(2);
  
  addText('Target Audience:', marginL, 10, 'bold');
  addText(creator?.targetAudience || '18-35 Demographics, Tech-savvy', marginL + 35, 10, 'normal');
  addSpacer(8);
  addLine();
  addSpacer(5);

  // ── Rate Card ──────────────────────────────────────────────────────────────
  addText('DELIVERABLES & PRICING', marginL, 14, 'bold', [0, 0, 0]);
  addSpacer(4);
  
  const deliverableY = y;
  doc.setFillColor(255, 255, 255);
  doc.rect(marginL, deliverableY, contentW, 25, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.rect(marginL, deliverableY, contentW, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Dedicated Integration (60-90s)', marginL + 5, deliverableY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text('Full focus on product, dedicated script & B-roll', marginL + 5, deliverableY + 14);
  
  doc.setFont('helvetica', 'bold');
  doc.text(baseRate, pageW - marginR - 35, deliverableY + 11);
  
  y = deliverableY + 35;
  addSpacer(5);
  addLine();
  addSpacer(5);

  // ── Past Brands / Portfolio ───────────────────────────────────────────────
  addText('TRUSTED BY', marginL, 14, 'bold', [0, 0, 0]);
  addSpacer(3);
  
  const pastBrandsText = creator?.pastBrands?.length 
    ? creator.pastBrands.join(', ')
    : 'Multiple premium brands across FMCG, Tech, and Finance sectors.';
    
  addText(pastBrandsText, marginL, 10, 'normal', [80, 80, 80], contentW);
  addSpacer(15);

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = 270;
  doc.setDrawColor(0, 0, 0);
  doc.line(marginL, footerY, pageW - marginR, footerY);
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated via CreatorStack on ${new Date().toLocaleDateString('en-IN')}`,
    marginL,
    footerY + 5,
  );
  doc.text(
    `Contact: ${creator?.email || 'via CreatorStack platform'}`,
    pageW - marginR,
    footerY + 5,
    { align: 'right' }
  );

  // Save
  doc.save(`${creator?.name || 'Creator'}_MediaKit.pdf`);
}
