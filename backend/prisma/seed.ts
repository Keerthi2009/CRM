import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 0. Create Platform org + Aggregator user (idempotent)
  const aggregatorExists = await prisma.user.findUnique({ where: { email: 'aggregator@platform.com' } });
  if (!aggregatorExists) {
    let platformOrg = await prisma.organisation.findFirst({ where: { name: 'Platform' } });
    if (!platformOrg) {
      platformOrg = await prisma.organisation.create({ data: { name: 'Platform' } });
    }
    const aggregatorHash = await bcrypt.hash('Aggregator@1234', 10);
    await prisma.user.create({
      data: {
        orgId: platformOrg.id,
        name: 'Aggregator',
        email: 'aggregator@platform.com',
        passwordHash: aggregatorHash,
        role: 'AGGREGATOR',
      },
    });
    console.log('Created aggregator: aggregator@platform.com');
  } else {
    console.log('Aggregator already exists. Skipping.');
  }

  const existing = await prisma.organisation.findFirst({ where: { name: 'Demo Org' } });
  if (existing) {
    console.log('Demo Org already seeded. Skipping demo data.');
    return;
  }

  // 1. Create Organisation
  const org = await prisma.organisation.create({
    data: { name: 'Demo Org' },
  });
  console.log(`Created organisation: ${org.name} (${org.id})`);

  // 2. Create Admin user
  const passwordHash = await bcrypt.hash('Admin@1234', 10);
  const admin = await prisma.user.create({
    data: {
      orgId: org.id,
      name: 'Admin User',
      email: 'admin@demo.com',
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // 3. Create default Pipeline with stages
  const pipeline = await prisma.pipeline.create({
    data: {
      orgId: org.id,
      name: 'Sales Pipeline',
      stages: {
        createMany: {
          data: [
            { name: 'New Lead',       type: 'NORMAL', order: 1 },
            { name: 'Contacted',      type: 'NORMAL', order: 2 },
            { name: 'Proposal Sent',  type: 'NORMAL', order: 3 },
            { name: 'Negotiation',    type: 'NORMAL', order: 4 },
            { name: 'Closed Won',     type: 'WON',    order: 5 },
            { name: 'Closed Lost',    type: 'LOST',   order: 6 },
          ],
        },
      },
    },
    include: { stages: { orderBy: { order: 'asc' } } },
  });
  console.log(`Created pipeline: ${pipeline.name} with ${pipeline.stages.length} stages`);

  // 4. Create Task Templates
  await prisma.taskTemplate.create({
    data: {
      orgId: org.id,
      name: 'Basic Follow-up',
      steps: [
        { title: 'Send introduction email',  description: 'Send a brief intro email with company overview' },
        { title: 'Schedule discovery call',  description: 'Book a 30-min discovery call with the prospect' },
        { title: 'Send follow-up email',     description: 'Follow up within 24 hours of the discovery call' },
        { title: 'Send proposal',            description: 'Prepare and send a formal proposal document' },
      ],
    },
  });

  await prisma.taskTemplate.create({
    data: {
      orgId: org.id,
      name: 'Site Survey Flow',
      steps: [
        { title: 'Schedule site visit',       description: 'Coordinate with client for on-site survey date' },
        { title: 'Conduct survey',            description: 'Complete site assessment checklist on location' },
        { title: 'Prepare survey report',     description: 'Document findings and recommendations' },
        { title: 'Present report to client',  description: 'Review survey results with stakeholders' },
        { title: 'Agree on action items',     description: 'Finalise scope, timeline, and next steps' },
      ],
    },
  });
  console.log('Created task templates: Basic Follow-up, Site Survey Flow');

  console.log('\nSeed completed successfully!');
  console.log('-----------------------------------');
  console.log('Aggregator: aggregator@platform.com / Aggregator@1234');
  console.log('Admin:      admin@demo.com / Admin@1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
