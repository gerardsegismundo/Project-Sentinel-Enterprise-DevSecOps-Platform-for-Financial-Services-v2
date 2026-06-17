FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY server/ ./server/
COPY tsconfig.json ./tsconfig.json
RUN npm run build

FROM node:20-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001
WORKDIR /app
COPY --from=builder --chown=nodeapp:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodeapp:nodejs /app/dist ./dist
COPY --from=builder --chown=nodeapp:nodejs /app/server ./server
USER nodeapp
EXPOSE 3000
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=256"
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
CMD ["node", "server/index.js"]
