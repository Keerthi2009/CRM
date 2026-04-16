import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

interface SignerRecord {
  role: string;
  name: string;
  email: string;
  token?: string;
  signed?: boolean;
  signedAt?: string | null;
}

function resolveSignerPlaceholders(
  html: string,
  signerIndex: number,
  signer: SignerRecord,
  signatureData: string,
): string {
  const n = signerIndex + 1; // 1-based
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const initials = signer.name
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  const sigImg = `<img src="${signatureData}"
    alt="Signature of ${signer.name}"
    style="max-width:220px;max-height:80px;vertical-align:middle;display:inline-block;" />`;

  const initialsImg = (() => {
    // Render initials as a small stylised image via a data-URL (inline SVG as base64)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40">
      <rect width="80" height="40" rx="4" fill="#fff"/>
      <text x="40" y="30" font-family="Georgia,serif" font-size="22" fill="#1a1a2e" text-anchor="middle">${initials}</text>
    </svg>`;
    const b64 = btoa(unescape(encodeURIComponent(svg)));
    return `<img src="data:image/svg+xml;base64,${b64}" alt="${initials}" style="max-height:38px;vertical-align:middle;" />`;
  })();

  return html
    .split(`{{signer${n}.signature}}`).join(sigImg)
    .split(`{{signer${n}.initials}}`).join(initialsImg)
    .split(`{{signer${n}.name}}`).join(`<strong>${signer.name}</strong>`)
    .split(`{{signer${n}.email}}`).join(signer.email)
    .split(`{{signer${n}.date}}`).join(date);
}

// GET /api/sign/:token  — public
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const contracts = await prisma.contract.findMany({
      where: { status: { in: ['SENT', 'COMPLETED'] } },
      include: { lead: { include: { organisation: true } } },
    });

    let foundContract = null;
    let foundSigner: SignerRecord | null = null;
    let foundIndex = -1;

    for (const c of contracts) {
      const signers = (c.signers as SignerRecord[] | null) ?? [];
      const idx = signers.findIndex((s) => s.token === token);
      if (idx !== -1) {
        foundContract = c;
        foundSigner = signers[idx];
        foundIndex = idx;
        break;
      }
    }

    if (!foundContract || !foundSigner) {
      return res.status(404).json({ error: 'Signing link not found or expired' });
    }

    return res.json({
      contractId: foundContract.id,
      title: foundContract.title,
      content: foundContract.content ?? '',
      signer: {
        role: foundSigner.role,
        name: foundSigner.name,
        email: foundSigner.email,
        signed: foundSigner.signed ?? false,
        signedAt: foundSigner.signedAt ?? null,
      },
      signerIndex: foundIndex,
      orgName: foundContract.lead.organisation?.name ?? 'CRM',
      leadName: foundContract.lead.name,
      contractStatus: foundContract.status,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/sign/:token  — public, submit signature
router.post('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { fullName, signatureData } = req.body as { fullName?: string; signatureData?: string };

    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Full name is required to sign' });
    }

    if (!signatureData || !signatureData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Signature image is required' });
    }

    const contracts = await prisma.contract.findMany({
      where: { status: { in: ['SENT', 'COMPLETED'] } },
    });

    let foundContract = null;
    let signerIndex = -1;

    for (const c of contracts) {
      const signers = (c.signers as SignerRecord[] | null) ?? [];
      const idx = signers.findIndex((s) => s.token === token);
      if (idx !== -1) { foundContract = c; signerIndex = idx; break; }
    }

    if (!foundContract || signerIndex === -1) {
      return res.status(404).json({ error: 'Signing link not found or expired' });
    }

    const signers = foundContract.signers as SignerRecord[];

    if (signers[signerIndex].signed) {
      return res.status(400).json({ error: 'Document already signed' });
    }

    const signerRecord: SignerRecord = {
      ...signers[signerIndex],
      name: fullName.trim(),
      signed: true,
      signedAt: new Date().toISOString(),
    };
    signers[signerIndex] = signerRecord;

    // Embed the e-signature into the contract HTML
    const currentContent = (foundContract.content as string | null) ?? '';
    const updatedContent = currentContent
      ? resolveSignerPlaceholders(currentContent, signerIndex, signerRecord, signatureData)
      : currentContent;

    const allSigned = signers.every((s) => s.signed);

    await prisma.contract.update({
      where: { id: foundContract.id },
      data: {
        signers,
        content: updatedContent || undefined,
        status: allSigned ? 'COMPLETED' : 'SENT',
        completedAt: allSigned ? new Date() : undefined,
      },
    });

    return res.json({ success: true, allSigned });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
