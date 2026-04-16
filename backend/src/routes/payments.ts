import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireManager } from '../middleware/rbac';
import { sendPaymentNotification } from '../services/payment';

const router = Router();

async function getLead(leadId: string, orgId: string) {
  return prisma.lead.findFirst({ where: { id: leadId, orgId } });
}

// GET /api/leads/:leadId/payments
router.get('/:leadId/payments', authenticate, async (req: AuthRequest, res) => {
  try {
    const lead = await getLead(req.params.leadId, req.user!.orgId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const payments = await prisma.payment.findMany({
      where: { leadId: req.params.leadId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(payments);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/leads/:leadId/payments
router.post(
  '/:leadId/payments',
  authenticate,
  requireManager,
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be positive'),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const lead = await getLead(req.params.leadId, req.user!.orgId);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });

      const { amount, currency, contractId, notes, status } = req.body;
      const payment = await prisma.payment.create({
        data: {
          leadId: req.params.leadId,
          amount: parseFloat(amount),
          currency: currency || 'USD',
          contractId: contractId || null,
          notes,
          status: status || 'PENDING',
        },
      });

      // Notify (stub — logs to console)
      if (lead.email) {
        await sendPaymentNotification(lead.email, payment.amount, payment.currency, payment.notes ?? undefined);
      }

      return res.status(201).json(payment);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  },
);

// PUT /api/leads/:leadId/payments/:paymentId
router.put('/:leadId/payments/:paymentId', authenticate, requireManager, async (req: AuthRequest, res) => {
  try {
    const lead = await getLead(req.params.leadId, req.user!.orgId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const payment = await prisma.payment.findFirst({
      where: { id: req.params.paymentId, leadId: req.params.leadId },
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const { amount, currency, status, notes, paidAt } = req.body;
    const updated = await prisma.payment.update({
      where: { id: req.params.paymentId },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : payment.amount,
        currency: currency ?? payment.currency,
        status: status ?? payment.status,
        notes: notes !== undefined ? notes : payment.notes,
        paidAt: paidAt !== undefined ? (paidAt ? new Date(paidAt) : null) : payment.paidAt,
      },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/leads/:leadId/payments/:paymentId
router.delete('/:leadId/payments/:paymentId', authenticate, requireManager, async (req: AuthRequest, res) => {
  try {
    const lead = await getLead(req.params.leadId, req.user!.orgId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const payment = await prisma.payment.findFirst({
      where: { id: req.params.paymentId, leadId: req.params.leadId },
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    await prisma.payment.delete({ where: { id: req.params.paymentId } });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
