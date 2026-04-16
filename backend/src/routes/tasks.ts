import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

async function getLead(leadId: string, orgId: string) {
  return prisma.lead.findFirst({ where: { id: leadId, orgId } });
}

// GET /api/leads/:leadId/tasks
router.get('/:leadId/tasks', authenticate, async (req: AuthRequest, res) => {
  try {
    const lead = await getLead(req.params.leadId, req.user!.orgId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const tasks = await prisma.task.findMany({
      where: { leadId: req.params.leadId },
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(tasks);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/leads/:leadId/tasks
router.post(
  '/:leadId/tasks',
  authenticate,
  body('title').notEmpty().withMessage('Title required'),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const lead = await getLead(req.params.leadId, req.user!.orgId);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });

      const { title, description, dueDate, assignedToId, templateId } = req.body;
      const task = await prisma.task.create({
        data: {
          leadId: req.params.leadId,
          title,
          description,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          assignedToId: assignedToId || req.user!.id,
          templateId,
        },
        include: { assignedTo: { select: { id: true, name: true, email: true } } },
      });
      return res.status(201).json(task);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  },
);

// PUT /api/leads/:leadId/tasks/:taskId
router.put('/:leadId/tasks/:taskId', authenticate, async (req: AuthRequest, res) => {
  try {
    const lead = await getLead(req.params.leadId, req.user!.orgId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const task = await prisma.task.findFirst({
      where: { id: req.params.taskId, leadId: req.params.leadId },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { title, description, dueDate, assignedToId } = req.body;
    const updated = await prisma.task.update({
      where: { id: req.params.taskId },
      data: {
        title: title ?? task.title,
        description: description ?? task.description,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
        assignedToId: assignedToId !== undefined ? assignedToId : task.assignedToId,
      },
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/leads/:leadId/tasks/:taskId/complete
router.put('/:leadId/tasks/:taskId/complete', authenticate, async (req: AuthRequest, res) => {
  try {
    const lead = await getLead(req.params.leadId, req.user!.orgId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const task = await prisma.task.findFirst({
      where: { id: req.params.taskId, leadId: req.params.leadId },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const completedAt = task.completedAt ? null : new Date();
    const updated = await prisma.task.update({
      where: { id: req.params.taskId },
      data: { completedAt },
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/leads/:leadId/tasks/:taskId
router.delete('/:leadId/tasks/:taskId', authenticate, async (req: AuthRequest, res) => {
  try {
    const lead = await getLead(req.params.leadId, req.user!.orgId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const task = await prisma.task.findFirst({
      where: { id: req.params.taskId, leadId: req.params.leadId },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await prisma.task.delete({ where: { id: req.params.taskId } });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
