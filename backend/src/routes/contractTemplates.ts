import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireManager } from '../middleware/rbac';

const router = Router();

// GET /api/contract-templates
router.get('/', authenticate, requireManager, async (req: AuthRequest, res) => {
  try {
    const templates = await prisma.contractTemplate.findMany({
      where: { orgId: req.user!.orgId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, signerCount: true, createdAt: true, updatedAt: true },
    });
    return res.json(templates);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/contract-templates/:id
router.get('/:id', authenticate, requireManager, async (req: AuthRequest, res) => {
  try {
    const template = await prisma.contractTemplate.findFirst({
      where: { id: req.params.id, orgId: req.user!.orgId },
    });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    return res.json(template);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/contract-templates
router.post(
  '/',
  authenticate,
  requireManager,
  body('name').notEmpty().withMessage('Name required'),
  body('content').notEmpty().withMessage('Content required'),
  body('signerCount').isInt({ min: 1, max: 10 }).withMessage('signerCount must be 1–10'),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { name, content, signerCount } = req.body;
      const template = await prisma.contractTemplate.create({
        data: { orgId: req.user!.orgId, name, content, signerCount: Number(signerCount) },
      });
      return res.status(201).json(template);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  },
);

// PUT /api/contract-templates/:id
router.put(
  '/:id',
  authenticate,
  requireManager,
  async (req: AuthRequest, res) => {
    try {
      const template = await prisma.contractTemplate.findFirst({
        where: { id: req.params.id, orgId: req.user!.orgId },
      });
      if (!template) return res.status(404).json({ error: 'Template not found' });

      const { name, content, signerCount } = req.body;
      const updated = await prisma.contractTemplate.update({
        where: { id: req.params.id },
        data: {
          name: name ?? template.name,
          content: content ?? template.content,
          signerCount: signerCount != null ? Number(signerCount) : template.signerCount,
        },
      });
      return res.json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  },
);

// DELETE /api/contract-templates/:id
router.delete('/:id', authenticate, requireManager, async (req: AuthRequest, res) => {
  try {
    const template = await prisma.contractTemplate.findFirst({
      where: { id: req.params.id, orgId: req.user!.orgId },
    });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    await prisma.contractTemplate.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
