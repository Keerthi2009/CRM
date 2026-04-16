import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin, requireManager } from '../middleware/rbac';

const router = Router();

// GET /api/pipelines
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const pipelines = await prisma.pipeline.findMany({
      where: { orgId: req.user!.orgId },
      include: {
        stages: { orderBy: { order: 'asc' }, include: { _count: { select: { leads: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(pipelines);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/pipelines
router.post(
  '/',
  authenticate,
  requireManager,
  body('name').notEmpty().withMessage('Name required'),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const pipeline = await prisma.pipeline.create({
        data: { orgId: req.user!.orgId, name: req.body.name },
        include: { stages: { orderBy: { order: 'asc' } } },
      });
      return res.status(201).json(pipeline);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  },
);

// GET /api/pipelines/:id
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const pipeline = await prisma.pipeline.findFirst({
      where: { id: req.params.id, orgId: req.user!.orgId },
      include: {
        stages: { orderBy: { order: 'asc' }, include: { _count: { select: { leads: true } } } },
      },
    });
    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
    return res.json(pipeline);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/pipelines/:id
router.put(
  '/:id',
  authenticate,
  requireManager,
  body('name').notEmpty().withMessage('Name required'),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const existing = await prisma.pipeline.findFirst({
        where: { id: req.params.id, orgId: req.user!.orgId },
      });
      if (!existing) return res.status(404).json({ error: 'Pipeline not found' });
      const pipeline = await prisma.pipeline.update({
        where: { id: req.params.id },
        data: { name: req.body.name },
        include: { stages: { orderBy: { order: 'asc' } } },
      });
      return res.json(pipeline);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  },
);

// DELETE /api/pipelines/:id
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.pipeline.findFirst({
      where: { id: req.params.id, orgId: req.user!.orgId },
    });
    if (!existing) return res.status(404).json({ error: 'Pipeline not found' });
    await prisma.pipeline.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/pipelines/:id/stages
router.post(
  '/:id/stages',
  authenticate,
  requireManager,
  body('name').notEmpty().withMessage('Name required'),
  body('type').isIn(['NORMAL', 'WON', 'LOST']).withMessage('Invalid stage type'),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const pipeline = await prisma.pipeline.findFirst({
        where: { id: req.params.id, orgId: req.user!.orgId },
        include: { stages: { orderBy: { order: 'desc' } } },
      });
      if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });

      const maxOrder = pipeline.stages[0]?.order ?? 0;
      const stage = await prisma.pipelineStage.create({
        data: {
          pipelineId: req.params.id,
          name: req.body.name,
          type: req.body.type || 'NORMAL',
          order: req.body.order ?? maxOrder + 1,
        },
      });
      return res.status(201).json(stage);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  },
);

// PUT /api/pipelines/:id/stages/:stageId
router.put(
  '/:id/stages/:stageId',
  authenticate,
  requireManager,
  async (req: AuthRequest, res) => {
    try {
      const stage = await prisma.pipelineStage.findFirst({
        where: { id: req.params.stageId, pipelineId: req.params.id },
      });
      if (!stage) return res.status(404).json({ error: 'Stage not found' });
      const updated = await prisma.pipelineStage.update({
        where: { id: req.params.stageId },
        data: {
          name: req.body.name ?? stage.name,
          type: req.body.type ?? stage.type,
          order: req.body.order ?? stage.order,
        },
      });
      return res.json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  },
);

// DELETE /api/pipelines/:id/stages/:stageId
router.delete(
  '/:id/stages/:stageId',
  authenticate,
  requireManager,
  async (req: AuthRequest, res) => {
    try {
      const stage = await prisma.pipelineStage.findFirst({
        where: { id: req.params.stageId, pipelineId: req.params.id },
      });
      if (!stage) return res.status(404).json({ error: 'Stage not found' });
      await prisma.pipelineStage.delete({ where: { id: req.params.stageId } });
      return res.json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  },
);

export default router;
