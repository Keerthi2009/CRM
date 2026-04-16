import { Router } from 'express';
import prisma from '../lib/prisma';
import { parseWebhookPayload } from '../services/docuseal';

const router = Router();

// POST /api/webhooks/docuseal
router.post('/docuseal', async (req, res) => {
  try {
    const payload = parseWebhookPayload(req.body);

    if (payload.event === 'submission.completed') {
      const submissionId = String(payload.data.id);

      await prisma.contract.updateMany({
        where: { docusealSubmissionId: submissionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
      console.log(`[Webhook] Contract completed for submission ${submissionId}`);
    }

    if (payload.event === 'submission.declined') {
      const submissionId = String(payload.data.id);
      await prisma.contract.updateMany({
        where: { docusealSubmissionId: submissionId },
        data: { status: 'DECLINED' },
      });
      console.log(`[Webhook] Contract declined for submission ${submissionId}`);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('[Webhook] Error processing docuseal webhook:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
