FROM node:24.16.0-alpine3.24

USER 0:0

RUN corepack enable \
    && COREPACK_ENABLE_STRICT=0 corepack enable pnpm

RUN apk add --no-cache git python3 make g++ \
    pixman-dev cairo-dev pango-dev libjpeg-turbo-dev giflib-dev librsvg-dev pkgconfig \
    && git config --add --system safe.directory /mermaid

ENV COREPACK_ENABLE_STRICT=0
ENV NODE_OPTIONS="--max_old_space_size=8192"

EXPOSE 9000 3333