import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin, requireManager } from '../middleware/rbac';

const router = Router();

const safeUser = (u: { id: string; name: string; email: string; role: string; orgId: string; createdAt: Date }) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  orgId: u.orgId,
  createdAt: u.createdAt,
});

// GET /api/users
// AGGREGATOR: optionally filter by ?orgId=, or returns all users
// Others: returns users in own org
router.get('/', authenticate, requireManager, async (req: AuthRequest, res) => {
  try {
    const isAggregator = req.user!.role === 'AGGREGATOR';
    const orgId = isAggregator
      ? (req.query.orgId as string | undefined)
      : req.user!.orgId;

    const users = await prisma.user.findMany({
      where: orgId ? { orgId } : undefined,
      orderBy: { name: 'asc' },
    });
    return res.json(users.map(safeUser));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users
// AGGREGATOR: must supply orgId in body to place user in a specific org
// ADMIN: creates user in own org
router.post(
  '/',
  authenticate,
  requireAdmin,
  body('name').notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('role').isIn(['AGGREGATOR', 'ADMIN', 'MANAGER', 'SALES_REP']).withMessage('Invalid role'),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { name, email, password, role, orgId: bodyOrgId } = req.body;
      const isAggregator = req.user!.role === 'AGGREGATOR';

      const targetOrgId = isAggregator ? bodyOrgId : req.user!.orgId;
      if (!targetOrgId) return res.status(400).json({ error: 'orgId is required' });

      // Verify org exists when AGGREGATOR supplies one
      if (isAggregator) {
        const org = await prisma.organisation.findUnique({ where: { id: targetOrgId } });
        if (!org) return res.status(404).json({ error: 'Organisation not found' });
      }

      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) return res.status(409).json({ error: 'Email already in use' });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { orgId: targetOrgId, name, email: email.toLowerCase(), passwordHash, role },
      });
      return res.status(201).json(safeUser(user));
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  },
);

// PUT /api/users/:id
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const isAggregator = req.user!.role === 'AGGREGATOR';
    const user = await prisma.user.findFirst({
      where: isAggregator ? { id: req.params.id } : { id: req.params.id, orgId: req.user!.orgId },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, email, role, password } = req.body;
    const data: Record<string, unknown> = {
      name: name ?? user.name,
      email: email ? email.toLowerCase() : user.email,
      role: role ?? user.role,
    };
    if (password) data.passwordHash = await bcrypt.hash(password, 10);

    const updated = await prisma.user.update({ where: { id: req.params.id }, data });
    return res.json(safeUser(updated));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    if (req.params.id === req.user!.id) return res.status(400).json({ error: 'Cannot delete your own account' });
    const isAggregator = req.user!.role === 'AGGREGATOR';
    const user = await prisma.user.findFirst({
      where: isAggregator ? { id: req.params.id } : { id: req.params.id, orgId: req.user!.orgId },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await prisma.user.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
