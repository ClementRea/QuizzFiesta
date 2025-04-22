FROM node:22-alpine AS build-stage

WORKDIR /app

RUN npm install -g @quasar/cli

COPY . .

RUN npm ci

RUN quasar build -m spa

FROM nginx:stable-alpine AS production-stage

WORKDIR /usr/share/nginx/html

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=build-stage /app/dist/spa /usr/share/nginx/html

RUN chown -R appuser:appgroup /usr/share/nginx/html && \
  chown -R appuser:appgroup /var/cache/nginx && \
  chown -R appuser:appgroup /var/log/nginx && \
  touch /var/run/nginx.pid && \
  chown -R appuser:appgroup /var/run/nginx.pid

USER appuser

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]