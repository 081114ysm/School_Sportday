# Railway/Render 등 컨테이너 호스트용 백엔드 이미지
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# 네이티브 의존(better-sqlite3 로컬 fallback용) 빌드를 위한 툴체인
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 런타임 이미지 — devDeps 제거
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 4001
CMD ["node", "dist/main.js"]
