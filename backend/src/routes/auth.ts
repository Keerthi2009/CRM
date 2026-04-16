import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post(
  '/login',
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { organisation: true },
      });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const secret = process.env.JWT_SECRET || 'default-secret';
      const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as string;
      const token = jwt.sign(
        { id: user.id, orgId: user.orgId, email: user.email, role: user.role },
        secret,
        { expiresIn } as jwt.SignOptions,
      );

      return res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          orgId: user.orgId,
          organisation: { id: user.organisation.id, name: user.organisation.name },
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  },
);

// POST /api/auth/register
router.post(
  '/register',
  body('name').notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('orgId').notEmpty().withMessage('Organisation ID required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, orgId, role } = req.body;
    try {
      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) return res.status(409).json({ error: 'Email already in use' });

      const org = await prisma.organisation.findUnique({ where: { id: orgId } });
      if (!org) return res.status(404).json({ error: 'Organisation not found' });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          orgId,
          name,
          email: email.toLowerCase(),
          passwordHash,
          role: role || 'SALES_REP',
        },
      });

      return res.status(201).json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role, orgId: user.orgId },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  },
);

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { organisation: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      organisation: { id: user.organisation.id, name: user.organisation.name },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
