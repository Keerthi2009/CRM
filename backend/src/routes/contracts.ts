import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireManager } from '../middleware/rbac';
import { createSubmission, DocusealSigner } from '../services/docuseal';
import { sendContractEmail } from '../services/email';

const router = Router();

async function getLead(leadId: string, orgId: string) {
  return prisma.lead.findFirst({ where: { id: leadId, orgId } });
}

// GET /api/leads/:leadId/contracts
router.get('/:leadId/contracts', authenticate, async (req: AuthRequest, res) => {
  try {
    const lead = await getLead(req.params.leadId, req.user!.orgId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const contracts = await prisma.contract.findMany({
      where: { leadId: req.params.leadId },
      include: { payments: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(contracts);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// POST /api/leads/:leadId/contracts
// Body: { title, templateId?, content?, signers?: [{role,name,email}] }
router.post(
  '/:leadId/contracts',
  authenticate,
  requireManager,
  body('title').notEmpty().withMessage('Title required'),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const lead = await getLead(req.params.leadId, req.user!.orgId);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });

      const { title, templateId, content, signers } = req.body;
      const contract = await prisma.contract.create({
        data: {
          leadId: req.params.leadId,
          templateId: templateId ?? null,
          title,
          content: content ?? null,
          signers: signers ?? null,
          status: 'DRAFT',
        },
        include: { payments: true },
      });
      return res.status(201).json(contract);
    } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
  },
);

// PUT /api/leads/:leadId/contracts/:contractId
router.put('/:leadId/contracts/:contractId', authenticate, requireManager, async (req: AuthRequest, res) => {
  try {
    const lead = await getLead(req.params.leadId, req.user!.orgId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const contract = await prisma.contract.findFirst({ where: { id: req.params.contractId, leadId: req.params.leadId } });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    const updated = await prisma.contract.update({
      where: { id: req.params.contractId },
      data: {
        title:   req.body.title   ?? contract.title,
        status:  req.body.status  ?? contract.status,
        content: req.body.content ?? contract.content,
        signers: req.body.signers ?? contract.signers,
      },
      include: { payments: true },
    });
    return res.json(updated);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// POST /api/leads/:leadId/contracts/:contractId/send
// Body: { signers: [{role,name,email}] }  — uses contract.signers if not provided
router.post('/:leadId/contracts/:contractId/send', authenticate, requireManager, async (req: AuthRequest, res) => {
  try {
    const lead = await getLead(req.params.leadId, req.user!.orgId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const contract = await prisma.contract.findFirst({ where: { id: req.params.contractId, leadId: req.params.leadId } });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    // Determine signers: from request body, or from saved contract.signers, or fall back to lead email
    const rawSigners: DocusealSigner[] = req.body.signers
      ?? (contract.signers as DocusealSigner[] | null)
      ?? [{ role: 'Signer 1', name: lead.name, email: lead.email ?? '' }];

    if (rawSigners.some((s) => !s.email)) {
      return res.status(400).json({ error: 'All signers must have an email address' });
    }

    // Assign a unique secure token to each signer for the self-hosted signing link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const signersWithTokens = rawSigners.map((s) => ({
      ...s,
      token: crypto.randomBytes(32).toString('hex'),
      signed: false,
      signedAt: null,
    }));

    const updated = await prisma.contract.update({
      where: { id: req.params.contractId },
      data: {
        signers: signersWithTokens,
        status: 'SENT',
        sentAt: new Date(),
      },
      include: { payments: true },
    });

    // Fetch org name for the email
    const org = await prisma.organisation.findUnique({ where: { id: req.user!.orgId } });
    const senderName = org?.name ?? 'CRM';

    // Send an email to each signer
    const emailResults = await Promise.allSettled(
      signersWithTokens.map((s) =>
        sendContractEmail({
          toName: s.name,
          toEmail: s.email,
          contractTitle: contract.title,
          signingUrl: `${frontendUrl}/sign/${s.token}`,
          senderName,
        }),
      ),
    );
    emailResults.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`[Email] Failed to send to ${signersWithTokens[i].email}:`, r.reason);
      }
    });

    // Also attempt DocuSeal (if configured); errors are non-fatal
    try {
      const submission = await createSubmission(
        contract.title,
        rawSigners,
        (contract.content as string | null) ?? undefined,
      );
      if (submission.submissionId && !submission.submissionId.startsWith('stub_')) {
        await prisma.contract.update({
          where: { id: req.params.contractId },
          data: { docusealSubmissionId: submission.submissionId },
        });
      }
    } catch (e) {
      console.warn('[DocuSeal] non-fatal error during send:', (e as Error).message);
    }

    // Return the first signer's self-hosted signing URL
    const signingUrl = `${frontendUrl}/sign/${signersWithTokens[0]?.token ?? ''}`;
    return res.json({ ...updated, signingUrl });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/leads/:leadId/contracts/:contractId
router.delete('/:leadId/contracts/:contractId', authenticate, requireManager, async (req: AuthRequest, res) => {
  try {
    const lead = await getLead(req.params.leadId, req.user!.orgId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const contract = await prisma.contract.findFirst({ where: { id: req.params.contractId, leadId: req.params.leadId } });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    await prisma.contract.delete({ where: { id: req.params.contractId } });
    return res.json({ success: true });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

export default router;
