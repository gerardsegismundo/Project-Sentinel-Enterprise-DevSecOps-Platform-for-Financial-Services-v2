# Full-stack Dockerfile (build context: repo root)
# Builds both React client and Express server into a single image

FROM node:20-alpine AS client-builder
WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:20-alpine AS server-builder
WORKDIR /app
COPY app/package*.json ./
RUN npm ci --only=production
COPY app/src/ ./src/

FROM node:20-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001
WORKDIR /app
COPY --from=server-builder --chown=nodeapp:nodejs /app/node_modules ./node_modules
COPY --from=server-builder --chown=nodeapp:nodejs /app/src ./src
COPY --from=client-builder --chown=nodeapp:nodejs /client/build ../client/build
USER nodeapp
EXPOSE 3000
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=256"
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
CMD ["node", "src/index.js"]
