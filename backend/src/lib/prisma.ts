import 'dotenv/config'
import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg(process.env.DATABASE_URL!)

const prisma = new PrismaClient({
  adapter: adapter as unknown as Prisma.PrismaClientOptions['adapter'],
})

export default prisma
