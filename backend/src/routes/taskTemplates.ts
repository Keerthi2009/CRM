import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireManager } from '../middleware/rbac';

const router = Router();

// GET /api/task-templates
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const templates = await prisma.taskTemplate.findMany({
      where: { orgId: req.user!.orgId },
      orderBy: { name: 'asc' },
    });
    return res.json(templates);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/task-templates
router.post(
  '/',
  authenticate,
  requireManager,
  body('name').notEmpty().withMessage('Name required'),
  body('steps').isArray({ min: 1 }).withMessage('Steps must be a non-empty array'),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const template = await prisma.taskTemplate.create({
        data: { orgId: req.user!.orgId, name: req.body.name, steps: req.body.steps },
      });
      return res.status(201).json(template);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  },
);

// PUT /api/task-templates/:id
router.put('/:id', authenticate, requireManager, async (req: AuthRequest, res) => {
  try {
    const tmpl = await prisma.taskTemplate.findFirst({ where: { id: req.params.id, orgId: req.user!.orgId } });
    if (!tmpl) return res.status(404).json({ error: 'Template not found' });

    const updated = await prisma.taskTemplate.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name ?? tmpl.name,
        steps: req.body.steps ?? tmpl.steps,
      },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/task-templates/:id
router.delete('/:id', authenticate, requireManager, async (req: AuthRequest, res) => {
  try {
    const tmpl = await prisma.taskTemplate.findFirst({ where: { id: req.params.id, orgId: req.user!.orgId } });
    if (!tmpl) return res.status(404).json({ error: 'Template not found' });
    await prisma.taskTemplate.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/task-templates/:id/apply/:leadId  (create tasks from template on a lead)
router.post('/:id/apply/:leadId', authenticate, async (req: AuthRequest, res) => {
  try {
    const tmpl = await prisma.taskTemplate.findFirst({ where: { id: req.params.id, orgId: req.user!.orgId } });
    if (!tmpl) return res.status(404).json({ error: 'Template not found' });

    const lead = await prisma.lead.findFirst({ where: { id: req.params.leadId, orgId: req.user!.orgId } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const steps = tmpl.steps as Array<{ title: string; description?: string }>;
    const tasks = await prisma.$transaction(
      steps.map((step) =>
        prisma.task.create({
          data: {
            leadId: req.params.leadId,
            templateId: tmpl.id,
            title: step.title,
            description: step.description,
            assignedToId: lead.assignedToId,
          },
        }),
      ),
    );
    return res.status(201).json(tasks);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
