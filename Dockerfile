FROM node:22.12.0-alpine3.19@sha256:40dc4b415c17b85bea9be05314b4a753f45a4e1716bb31c01182e6c53d51a654

USER 0:0

RUN npm install -g corepack@latest \
    && corepack enable \
    && corepack prepare pnpm@latest --activate

RUN apk add --no-cache \
    git=2.43.0-r0 \
    python3=3.11.14-r0 \
    make=4.4.1-r2 \
    g++=13.2.1_git20231014-r0 \
    pkgconf=2.1.0-r0 \
    pixman-dev=0.42.2-r2 \
    cairo-dev=1.18.4-r0 \
    pango-dev=1.51.0-r0 \
    libjpeg-turbo-dev=3.0.1-r0 \
    giflib-dev=5.2.2-r0 \
    && git config --add --system safe.directory /mermaid

ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PATH}:${PNPM_HOME}"
ENV NODE_OPTIONS="--max_old_space_size=8192"

EXPOSE 9000 3333