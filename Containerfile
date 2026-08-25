# =============================================================================
# Luna Forum — Containerfile
#
# 构建：
#   podman build -t quay.io/unknownmp/luna-forum:dev.1 .
#
# 运行（二选一提供配置）：
#   1) 挂载配置文件（推荐）：
#      podman run -d -p 3000:3000 \
#        -v ./config.json:/app/config.json:Z,readonly \
#        quay.io/unknownmp/luna-forum:dev.1
#
#   2) 通过 CONFIG 环境变量注入 JSON 配置：
#      podman run -d -p 3000:3000 \
#        -e CONFIG='{"mongodb":{"uri":"mongodb://...","dbName":"forum"},"jwt_secret":"...","plugins":[...]}' \
#        quay.io/unknownmp/luna-forum:dev.1
#
# 说明：
#   - MongoDB 为外部依赖，请将 uri 指向可达的数据库实例。
#   - 监听端口默认 3000，可通过 DB configs 集合中的 server.port 覆盖。
# =============================================================================

# ---------- 构建阶段：安装全部依赖并编译 ----------
FROM docker.io/library/node:24-slim AS builder

WORKDIR /app

# 先只拷贝依赖清单，充分利用层缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install --global pnpm@11.22.0 \
    && pnpm install --frozen-lockfile

# 拷贝源码并执行完整构建：前端 bundle + tsc + tscp
COPY . .
# 注意：plugins/frontend/build.mjs 引用 esbuild，但它未声明在 package.json 中
# （仅是 tsx 的传递依赖，pnpm 严格布局下无法解析），故在此显式补装
RUN pnpm add -D esbuild@^0.28.2 \
    && pnpm build \
    # tscp 会跳过 .js 静态资源（如 public/dist/bundle.js、scripts/sidebar.js），
    # 这里把前端插件的静态产物补拷贝到编译输出目录
    && mkdir -p dist/plugins/frontend/public \
    && cp -r plugins/frontend/public/. dist/plugins/frontend/public/ \
    && rm -rf dist/.git dist/config.json

# ---------- 运行阶段：仅生产依赖 + 编译产物 ----------
FROM docker.io/library/node:24-slim AS runtime

ENV NODE_ENV=production \
    CONFIG_PATH=/app/config.json \
    PORT=3000

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install --global pnpm@11.22.0 \
    && pnpm install --prod --frozen-lockfile \
    && npm uninstall --global pnpm \
    && rm -rf /root/.npm /root/.local/share/pnpm /tmp/*

COPY --from=builder --chown=node:node /app/dist ./dist

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["node", "dist/index.js"]

LABEL org.opencontainers.image.title="Luna Forum" \
      org.opencontainers.image.description="轻量、高性能的论坛系统，基于 TypeScript + Fastify + MongoDB 的微内核插件架构" \
      org.opencontainers.image.licenses="AGPL-3.0-or-later" \
      org.opencontainers.image.source="https://github.com/unknownmp/Luna-Forum" \
      org.opencontainers.image.base.name="docker.io/library/node:24-slim"
