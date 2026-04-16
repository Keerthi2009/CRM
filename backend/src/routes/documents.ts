import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20 MB

async function getLead(leadId: string, orgId: string) {
  return prisma.lead.findFirst({ where: { id: leadId, orgId } });
}

// GET /api/leads/:leadId/documents
router.get('/:leadId/documents', authenticate, async (req: AuthRequest, res) => {
  try {
    const lead = await getLead(req.params.leadId, req.user!.orgId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const docs = await prisma.document.findMany({
      where: { leadId: req.params.leadId },
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(docs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/leads/:leadId/documents
router.post(
  '/:leadId/documents',
  authenticate,
  upload.single('file'),
  async (req: AuthRequest, res) => {
    try {
      const lead = await getLead(req.params.leadId, req.user!.orgId);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const doc = await prisma.document.create({
        data: {
          leadId: req.params.leadId,
          uploadedById: req.user!.id,
          name: req.body.name || req.file.originalname,
          url: `/uploads/${req.file.filename}`,
          mimeType: req.file.mimetype,
          size: req.file.size,
        },
        include: { uploadedBy: { select: { id: true, name: true } } },
      });
      return res.status(201).json(doc);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  },
);

// DELETE /api/leads/:leadId/documents/:docId
router.delete('/:leadId/documents/:docId', authenticate, async (req: AuthRequest, res) => {
  try {
    const lead = await getLead(req.params.leadId, req.user!.orgId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const doc = await prisma.document.findFirst({
      where: { id: req.params.docId, leadId: req.params.leadId },
    });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Remove file from disk
    const filePath = path.join(process.cwd(), doc.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.document.delete({ where: { id: req.params.docId } });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
