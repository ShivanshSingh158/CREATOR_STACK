import type { VercelRequest, VercelResponse } from '@vercel/node';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const FROM_EMAIL = 'officialcreator.stack@gmail.com';
const FROM_NAME = 'CreatorStack';

// ── Email Templates ───────────────────────────────────────────────────────────

const baseStyle = `
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 600px; margin: 0 auto; background: #ffffff;
`;

function wrapTemplate(body: string, preheader: string = '') {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CreatorStack Notification</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="${baseStyle}border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#4f46e5;padding:28px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:20px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">CreatorStack</div>
                  <div style="font-size:11px;font-weight:700;color:#a5b4fc;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">Escrow-Backed Creator Marketplace</div>
                </td>
                <td align="right">
                  <div style="width:40px;height:40px;background:rgba(255,255,255,0.15);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;">⚡</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:2px solid #e2e8f0;padding:24px 40px;">
            <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
              CreatorStack · Bangalore, India · All payments are escrow-protected
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">
              TDS deducted at source per Indian Income Tax Act. Form 16A issued quarterly.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function statPill(label: string, value: string) {
  return `<td align="center" style="padding:0 8px;">
    <div style="background:#f1f5f9;border:2px solid #1e293b;border-radius:10px;padding:12px 20px;">
      <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">${label}</div>
      <div style="font-size:18px;font-weight:900;color:#0f172a;">${value}</div>
    </div>
  </td>`;
}

function ctaButton(text: string, url: string, color = '#4f46e5') {
  return `<a href="${url}" style="display:inline-block;background:${color};color:#ffffff;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;padding:14px 32px;border-radius:10px;text-decoration:none;border:2px solid #0f172a;box-shadow:3px 3px 0px #0f172a;">
    ${text} →
  </a>`;
}

function heading(text: string, emoji = '') {
  return `<h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">${emoji ? emoji + ' ' : ''}${text}</h1>`;
}

function subtext(text: string) {
  return `<p style="margin:0 0 28px;font-size:15px;color:#475569;font-weight:500;line-height:1.6;">${text}</p>`;
}

// ── Template Builders ─────────────────────────────────────────────────────────

function applicationAccepted(creatorName: string, campaignTitle: string, brandName: string, dashboardUrl: string) {
  return wrapTemplate(`
    ${heading('Your Application Was Accepted!', '🎉')}
    ${subtext(`Great news, <strong>${creatorName}</strong>! <strong>${brandName}</strong> has shortlisted you for their campaign.`)}
    <div style="background:#f0fdf4;border:2px solid #0f172a;border-radius:12px;padding:24px;margin-bottom:28px;">
      <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Campaign</div>
      <div style="font-size:18px;font-weight:900;color:#0f172a;">${campaignTitle}</div>
      <div style="font-size:13px;font-weight:600;color:#16a34a;margin-top:4px;">by ${brandName}</div>
    </div>
    <p style="font-size:14px;color:#475569;margin-bottom:28px;line-height:1.6;">
      The brand may reach out via CreatorStack Messages or initiate a Deal Room. Check your dashboard for updates.
    </p>
    ${ctaButton('View Dashboard', dashboardUrl, '#16a34a')}
  `, `${brandName} accepted your application for ${campaignTitle}`);
}

function contractSigned(
  recipientName: string, role: 'brand' | 'creator',
  campaignTitle: string, otherParty: string,
  amount: string, dealRoomUrl: string
) {
  const isBrand = role === 'brand';
  return wrapTemplate(`
    ${heading('Contract Signed — Both Parties', '✍️')}
    ${subtext(`Hi <strong>${recipientName}</strong>, the e-stamp contract for <strong>${campaignTitle}</strong> has been signed by both parties.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        ${statPill('Deal Value', amount)}
        ${statPill(isBrand ? 'Creator' : 'Brand', otherParty)}
        ${statPill('Status', 'Signed ✅')}
      </tr>
    </table>
    <div style="background:#eff6ff;border:2px solid #0f172a;border-radius:12px;padding:20px;margin-bottom:28px;">
      <p style="margin:0;font-size:13px;font-weight:600;color:#1e40af;line-height:1.6;">
        ${isBrand 
          ? '⏳ Next step: Lock escrow funds to begin production. The creator will receive a kickoff notification.' 
          : '⏳ Next step: Wait for the brand to lock escrow funds. You will receive a notification once production can begin.'}
      </p>
    </div>
    ${ctaButton('Open Deal Room', dealRoomUrl)}
  `, `Contract signed for ${campaignTitle}`);
}

function escrowLocked(
  creatorName: string, campaignTitle: string, brandName: string,
  amount: string, netPayout: string, productionDays: string, dealRoomUrl: string
) {
  return wrapTemplate(`
    ${heading('Escrow Locked — Production Begin!', '🔐')}
    ${subtext(`Hi <strong>${creatorName}</strong>, <strong>${brandName}</strong> has locked the escrow. Your funds are now secured. Time to create!`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        ${statPill('Locked Amount', amount)}
        ${statPill('Your Net Payout', netPayout)}
        ${statPill('Days to Deliver', productionDays)}
      </tr>
    </table>
    <div style="background:#fef3c7;border:2px solid #0f172a;border-radius:12px;padding:20px;margin-bottom:28px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#92400e;">
        ⏰ Your production clock has started. Submit your deliverable link within <strong>${productionDays} days</strong> via the Deal Room.
      </p>
    </div>
    <div style="background:#f0fdf4;border:2px solid #0f172a;border-radius:12px;padding:20px;margin-bottom:28px;">
      <p style="margin:0;font-size:12px;font-weight:600;color:#166534;">
        🛡️ Your payment is 100% guaranteed. Funds are held in CreatorStack escrow and will be released automatically after brand approval or 48-hour timer.
      </p>
    </div>
    ${ctaButton('Go to Deal Room', dealRoomUrl, '#059669')}
  `, `Escrow locked for ${campaignTitle} — production begins now`);
}

function dealCompleted(
  creatorName: string, campaignTitle: string, brandName: string,
  grossAmount: string, tdsAmount: string, netPayout: string, upiId: string
) {
  return wrapTemplate(`
    ${heading('Payment Released — Deal Complete!', '💰')}
    ${subtext(`Congratulations <strong>${creatorName}</strong>! Your delivery for <strong>${campaignTitle}</strong> was approved and payment has been released.`)}
    <div style="background:#0f172a;border-radius:12px;padding:28px;margin-bottom:28px;text-align:center;">
      <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Net Payout to Your UPI</div>
      <div style="font-size:36px;font-weight:900;color:#a3e635;letter-spacing:-1px;">${netPayout}</div>
      <div style="font-size:12px;font-weight:600;color:#64748b;margin-top:8px;">→ ${upiId}</div>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        ${statPill('Gross Amount', grossAmount)}
        ${statPill('TDS (10%)', tdsAmount)}
        ${statPill('Net Payout', netPayout)}
      </tr>
    </table>
    <div style="background:#f1f5f9;border:2px solid #0f172a;border-radius:12px;padding:16px;margin-bottom:28px;">
      <p style="margin:0;font-size:12px;font-weight:600;color:#475569;">
        📄 TDS deducted under Section 194C of Income Tax Act. Form 16A will be issued at the end of the quarter. The UPI payout will arrive within 2-4 hours.
      </p>
    </div>
    <p style="font-size:13px;color:#475569;margin-bottom:20px;">Brand: <strong>${brandName}</strong> · Campaign: <strong>${campaignTitle}</strong></p>
  `, `Payment released — ${netPayout} from ${brandName}`);
}

function kycStatusUpdate(
  userName: string, status: 'approved' | 'rejected',
  role: string, rejectionReason?: string
) {
  const isApproved = status === 'approved';
  return wrapTemplate(`
    ${heading(isApproved ? 'KYC Verified — You\'re All Set!' : 'KYC Review Update', isApproved ? '✅' : '⚠️')}
    ${subtext(`Hi <strong>${userName}</strong>, here's an update on your KYC verification for CreatorStack.`)}
    <div style="background:${isApproved ? '#f0fdf4' : '#fef2f2'};border:2px solid #0f172a;border-radius:12px;padding:24px;margin-bottom:28px;">
      <div style="font-size:14px;font-weight:900;color:${isApproved ? '#166534' : '#991b1b'};margin-bottom:8px;">
        ${isApproved ? '✅ Verification Approved' : '❌ Verification Rejected'}
      </div>
      <p style="margin:0;font-size:13px;font-weight:600;color:${isApproved ? '#15803d' : '#b91c1c'};line-height:1.6;">
        ${isApproved 
          ? `Your ${role} account is now fully verified on CreatorStack. You can now access all platform features including deal rooms, escrow payments, and campaign management.`
          : `Unfortunately your KYC submission was not approved. ${rejectionReason ? `<br/><br/>Reason: ${rejectionReason}` : 'Please re-submit with correct documents.'}`
        }
      </p>
    </div>
    ${isApproved 
      ? ctaButton('Go to Dashboard', role === 'brand' ? 'https://thecreatorstack.vercel.app/brand-dashboard' : 'https://thecreatorstack.vercel.app/creator-dashboard', '#4f46e5')
      : ctaButton('Re-Submit KYC', 'https://thecreatorstack.vercel.app/profile', '#dc2626')
    }
  `, isApproved ? 'Your KYC has been approved' : 'KYC review update from CreatorStack');
}

// ── Event Types & Handler ────────────────────────────────────────────────────

type EmailPayload =
  | { type: 'application_accepted'; toEmail: string; creatorName: string; campaignTitle: string; brandName: string; dashboardUrl: string }
  | { type: 'contract_signed'; toEmail: string; recipientName: string; role: 'brand' | 'creator'; campaignTitle: string; otherParty: string; amount: string; dealRoomUrl: string }
  | { type: 'escrow_locked'; toEmail: string; creatorName: string; campaignTitle: string; brandName: string; amount: string; netPayout: string; productionDays: string; dealRoomUrl: string }
  | { type: 'deal_completed'; toEmail: string; creatorName: string; campaignTitle: string; brandName: string; grossAmount: string; tdsAmount: string; netPayout: string; upiId: string }
  | { type: 'kyc_status'; toEmail: string; userName: string; status: 'approved' | 'rejected'; role: string; rejectionReason?: string };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const payload = req.body as EmailPayload;
  if (!payload?.type || !payload?.toEmail) {
    return res.status(400).json({ error: 'Missing type or toEmail' });
  }

  try {
    let subject = '';
    let html = '';

    switch (payload.type) {
      case 'application_accepted':
        subject = `🎉 You were shortlisted for "${payload.campaignTitle}"`;
        html = applicationAccepted(payload.creatorName, payload.campaignTitle, payload.brandName, payload.dashboardUrl);
        break;
      case 'contract_signed':
        subject = `✍️ Contract signed — ${payload.campaignTitle}`;
        html = contractSigned(payload.recipientName, payload.role, payload.campaignTitle, payload.otherParty, payload.amount, payload.dealRoomUrl);
        break;
      case 'escrow_locked':
        subject = `🔐 Escrow locked — Start production for "${payload.campaignTitle}"`;
        html = escrowLocked(payload.creatorName, payload.campaignTitle, payload.brandName, payload.amount, payload.netPayout, payload.productionDays, payload.dealRoomUrl);
        break;
      case 'deal_completed':
        subject = `💰 Payment released — ${payload.netPayout} from ${payload.brandName}`;
        html = dealCompleted(payload.creatorName, payload.campaignTitle, payload.brandName, payload.grossAmount, payload.tdsAmount, payload.netPayout, payload.upiId);
        break;
      case 'kyc_status':
        subject = payload.status === 'approved' ? '✅ KYC Approved — You\'re verified on CreatorStack!' : '⚠️ KYC Verification Update';
        html = kycStatusUpdate(payload.userName, payload.status, payload.role, payload.rejectionReason);
        break;
      default:
        return res.status(400).json({ error: 'Unknown email type' });
    }

    await sgMail.send({
      to: payload.toEmail,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      html,
    });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('[send-email] Error:', err?.response?.body || err);
    return res.status(500).json({ error: 'Failed to send email', detail: err?.message });
  }
}
