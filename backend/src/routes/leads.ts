import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin, requireManager } from '../middleware/rbac';

const router = Router();

function leadWhere(req: AuthRequest, extra: Record<string, unknown> = {}) {
  const base = req.user!.role === 'SALES_REP'
    ? { orgId: req.user!.orgId, assignedToId: req.user!.id }
    : { orgId: req.user!.orgId };
  return { ...base, ...extra };
}

const leadInclude = {
  stage: true,
  pipeline: true,
  assignedTo: { select: { id: true, name: true, email: true } },
};

// GET /api/leads
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { pipelineId, stageId, search, assignedToId } = req.query as Record<string, string>;
    const extra: Record<string, unknown> = {};
    if (pipelineId) extra.pipelineId = pipelineId;
    if (stageId) extra.stageId = stageId;
    if (assignedToId) extra.assignedToId = assignedToId;

    const where: Record<string, unknown> = leadWhere(req, extra);
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where: where as Prisma.LeadWhereInput,
      include: leadInclude,
      orderBy: { createdAt: 'desc' },
    });
    return res.json(leads);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/leads
router.post(
  '/',
  authenticate,
  body('name').notEmpty().withMessage('Name required'),
  body('pipelineId').notEmpty().withMessage('Pipeline required'),
  body('stageId').notEmpty().withMessage('Stage required'),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { name, email, phone, company, address, lat, lng, value, pipelineId, stageId, assignedToId } = req.body;

      const pipeline = await prisma.pipeline.findFirst({ where: { id: pipelineId, orgId: req.user!.orgId } });
      if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });

      const stage = await prisma.pipelineStage.findFirst({ where: { id: stageId, pipelineId } });
      if (!stage) return res.status(404).json({ error: 'Stage not found' });

      const lead = await prisma.lead.create({
        data: {
          orgId: req.user!.orgId,
          pipelineId,
          stageId,
          assignedToId: assignedToId || req.user!.id,
          name,
          email,
          phone,
          company,
          address,
          lat: lat ? parseFloat(lat) : undefined,
          lng: lng ? parseFloat(lng) : undefined,
          value: value ? parseFloat(value) : 0,
        },
        include: leadInclude,
      });
      return res.status(201).json(lead);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  },
);

// GET /api/leads/:id
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: leadWhere(req, { id: req.params.id }),
      include: {
        ...leadInclude,
        tasks: {
          include: { assignedTo: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
        documents: {
          include: { uploadedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        contracts: { include: { payments: true }, orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    return res.json(lead);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/leads/:id
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.lead.findFirst({ where: leadWhere(req, { id: req.params.id }) });
    if (!existing) return res.status(404).json({ error: 'Lead not found' });

    const { name, email, phone, company, address, lat, lng, value, stageId, assignedToId } = req.body;
    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: {
        name: name ?? existing.name,
        email: email ?? existing.email,
        phone: phone ?? existing.phone,
        company: company ?? existing.company,
        address: address ?? existing.address,
        lat: lat !== undefined ? parseFloat(lat) : existing.lat,
        lng: lng !== undefined ? parseFloat(lng) : existing.lng,
        value: value !== undefined ? parseFloat(value) : existing.value,
        stageId: stageId ?? existing.stageId,
        assignedToId: assignedToId !== undefined ? assignedToId : existing.assignedToId,
      },
      include: leadInclude,
    });
    return res.json(lead);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/leads/:id
router.delete('/:id', authenticate, requireManager, async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.lead.findFirst({ where: { id: req.params.id, orgId: req.user!.orgId } });
    if (!existing) return res.status(404).json({ error: 'Lead not found' });
    await prisma.lead.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/leads/:id/stage  (move stage — kanban drag)
router.put('/:id/stage', authenticate, async (req: AuthRequest, res) => {
  try {
    const { stageId } = req.body;
    if (!stageId) return res.status(400).json({ error: 'stageId required' });

    const lead = await prisma.lead.findFirst({ where: leadWhere(req, { id: req.params.id }) });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const stage = await prisma.pipelineStage.findFirst({ where: { id: stageId, pipelineId: lead.pipelineId } });
    if (!stage) return res.status(404).json({ error: 'Stage not found in this pipeline' });

    const updated = await prisma.lead.update({
      where: { id: req.params.id },
      data: { stageId },
      include: leadInclude,
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
