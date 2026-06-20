FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Pass build-time API URL (defaults to localhost for dev)
ARG VITE_API_URL=http://localhost:4000/graphql
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

RUN apk add --no-cache curl

CMD ["nginx", "-g", "daemon off;"]
