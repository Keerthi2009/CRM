FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# DATABASE_URL must exist for prisma.config.ts to load during generate (no real connection made)
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
# tsconfig.build.json restricts include to src (prisma/seed.ts is outside rootDir)
RUN npx prisma generate && npx tsc --project tsconfig.build.json

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY package*.json ./
RUN mkdir -p uploads
EXPOSE 3001
CMD sh -c "npx prisma migrate deploy && node dist/index.js"
