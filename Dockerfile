FROM node:22.12.0-alpine3.19@sha256:40dc4b415c17b85bea9be05314b4a753f45a4e1716bb

USER 0:0

RUN npm install -g corepack@latest \
  && corepack enable \
  && corepack prepare pnpm@latest --activate

# DL3018: versions pinned with ~= (prefix match) as required by hadolint
RUN apk add --no-cache \
  git~=2.43 \
  python3~=3.11 \
  make~=4.4 \
  g++~=13.2 \
  pkgconf~=2.1 \
  pixman-dev~=0.42 \
  cairo-dev~=1.18 \
  pango-dev~=1.51 \
  libjpeg-turbo-dev~=3.0 \
  giflib-dev~=5.2 \
  && git config --add --system safe.directory /mermaid

ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PATH}:${PNPM_HOME}"
ENV NODE_OPTIONS="--max_old_space_size=8192"

EXPOSE 9000 3333