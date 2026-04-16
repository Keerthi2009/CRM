import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/dashboard
router.get('/', authenticate, async (req: AuthRequest, res) => {
  const { orgId, role, id: userId } = req.user!;

  try {
    const whereClause =
      role === 'SALES_REP'
        ? { orgId, assignedToId: userId }
        : { orgId };

    const [leads, stages] = await Promise.all([
      prisma.lead.findMany({
        where: whereClause,
        include: {
          stage: true,
          pipeline: true,
          assignedTo: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pipelineStage.findMany({
        where: { pipeline: { orgId } },
        orderBy: { order: 'asc' },
      }),
    ]);

    const wonLeads = leads.filter((l) => l.stage.type === 'WON');
    const lostLeads = leads.filter((l) => l.stage.type === 'LOST');
    const activeLeads = leads.filter((l) => l.stage.type === 'NORMAL');

    const totalValue = leads.reduce((s, l) => s + (l.value || 0), 0);
    const wonValue = wonLeads.reduce((s, l) => s + (l.value || 0), 0);
    const conversionRate = leads.length > 0 ? (wonLeads.length / leads.length) * 100 : 0;

    const stageMap: Record<string, { stage: string; count: number; value: number }> = {};
    for (const s of stages) {
      stageMap[s.id] = { stage: s.name, count: 0, value: 0 };
    }
    for (const l of leads) {
      if (stageMap[l.stageId]) {
        stageMap[l.stageId].count++;
        stageMap[l.stageId].value += l.value || 0;
      }
    }

    return res.json({
      totalLeads: leads.length,
      wonLeads: wonLeads.length,
      lostLeads: lostLeads.length,
      activeLeads: activeLeads.length,
      totalValue,
      wonValue,
      conversionRate: Math.round(conversionRate * 10) / 10,
      leadsPerStage: Object.values(stageMap),
      recentLeads: leads.slice(0, 10),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
