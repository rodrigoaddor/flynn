FROM node:16-alpine as builder

ENV NODE_ENV build
ENV PNPM_VERSION 7.3.0

WORKDIR /home/node

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate && pnpm install --frozen-lockfile

COPY --chown=node:node . .
RUN pnpm run build \
    && pnpm prune --production

FROM node:16-alpine

ENV NODE_ENV production

USER node
WORKDIR /home/node

COPY --from=builder --chown=node:node /home/node/package*.json ./
COPY --from=builder --chown=node:node /home/node/node_modules/ ./node_modules/
COPY --from=builder --chown=node:node /home/node/dist/ ./dist/

CMD ["node", "dist/main.js"]