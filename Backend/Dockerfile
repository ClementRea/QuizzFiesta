FROM node:22-alpine

RUN apk add --no-cache wget && \
    addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY Backend/package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY --chown=appuser:appgroup Backend/ .

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "src/server.js"]