import nodemailer from 'nodemailer';

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    // Ethereal test account fallback — logs preview URL to console
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export interface ContractEmailOptions {
  toName: string;
  toEmail: string;
  contractTitle: string;
  signingUrl: string;       // frontend /sign/:token URL
  senderName: string;       // org / sender name
}

export async function sendContractEmail(opts: ContractEmailOptions): Promise<void> {
  const transport = createTransport();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    .header { background: #1a2035; padding: 28px 32px; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; }
    .body { padding: 32px; color: #333; }
    .body p { line-height: 1.7; margin: 0 0 16px; }
    .btn { display: inline-block; margin: 24px 0; padding: 14px 32px; background: #1976d2; color: #fff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; }
    .footer { padding: 20px 32px; background: #f8f9fa; color: #888; font-size: 12px; border-top: 1px solid #eee; }
    .link-note { font-size: 13px; color: #666; word-break: break-all; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Document Ready to Sign</h1>
    </div>
    <div class="body">
      <p>Dear <strong>${opts.toName}</strong>,</p>
      <p><strong>${opts.senderName}</strong> has sent you a document for your review and signature:</p>
      <p><strong>${opts.contractTitle}</strong></p>
      <p>Please click the button below to review and sign the document. No account is required.</p>
      <a href="${opts.signingUrl}" class="btn">Review &amp; Sign Document</a>
      <p class="link-note">Or copy this link into your browser:<br/>${opts.signingUrl}</p>
    </div>
    <div class="footer">
      This message was sent by ${opts.senderName}. If you believe you received this in error, please ignore it.
    </div>
  </div>
</body>
</html>`;

  const mailOptions = {
    from: `"${opts.senderName}" <${process.env.SMTP_USER}>`,
    to: `"${opts.toName}" <${opts.toEmail}>`,
    subject: `Please sign: ${opts.contractTitle}`,
    html,
  };

  if (!transport) {
    // No SMTP configured — create a temporary Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    const testTransport = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    const info = await testTransport.sendMail(mailOptions);
    console.log(`[Email] No SMTP configured. Preview: ${nodemailer.getTestMessageUrl(info)}`);
    return;
  }

  await transport.sendMail(mailOptions);
  console.log(`[Email] Contract email sent to ${opts.toEmail}`);
}
