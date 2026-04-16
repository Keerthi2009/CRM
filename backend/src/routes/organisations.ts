import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin, requireAggregator } from '../middleware/rbac';

const router = Router();

// GET /api/organisations  (returns all orgs — used on register page to pick org)
router.get('/', async (_req, res) => {
  try {
    const orgs = await prisma.organisation.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return res.json(orgs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/organisations  (AGGREGATOR only)
router.post(
  '/',
  authenticate,
  requireAggregator,
  body('name').notEmpty().withMessage('Organisation name required'),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { name } = req.body;
      const org = await prisma.organisation.create({ data: { name } });
      return res.status(201).json(org);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  },
);

// GET /api/organisations/:id
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const isAggregator = req.user!.role === 'AGGREGATOR';
    if (!isAggregator && req.user!.orgId !== req.params.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const org = await prisma.organisation.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { users: true, pipelines: true, leads: true } } },
    });
    if (!org) return res.status(404).json({ error: 'Organisation not found' });
    return res.json(org);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/organisations/:id
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    if (req.user!.orgId !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const org = await prisma.organisation.update({
      where: { id: req.params.id },
      data: { name },
    });
    return res.json(org);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
