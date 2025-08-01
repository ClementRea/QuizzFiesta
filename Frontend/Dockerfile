FROM node:22-alpine AS builder

WORKDIR /app
RUN npm install -g @quasar/cli

COPY . .

RUN npm ci

RUN quasar build

FROM nginx:alpine
COPY --from=builder /app/dist/spa /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]