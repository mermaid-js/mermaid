FROM node:22.12.0-alpine3.19@sha256:40dc4b415c17b85bea9be05314b4a753f45a4e1716bb31c01182e6c53d51a654

USER 0:0

RUN apk add --no-cache \
    git~=2.43 \
    python3~=3.11 \
    make~=4.4 \
    g++~=13.2 \
    curl~=8.12 \
    pixman-dev~=0.42 \
    cairo-dev~=1.18 \
    pango-dev~=1.51 \
    libjpeg-turbo-dev~=3.0 \
    giflib-dev~=5.2 \
    && git config --add --system safe.directory /mermaid

RUN corepack enable && corepack enable pnpm

SHELL ["/bin/ash", "-eo", "pipefail", "-c"]

RUN mkdir -p /root/.node-gyp/22.12.0 && \
    curl -sSL https://nodejs.org/dist/v22.12.0/node-v22.12.0-headers.tar.gz | tar -xzf - -C /root/.node-gyp/22.12.0 --strip-components=1 && \
    echo "9" > /root/.node-gyp/22.12.0/installVersion

WORKDIR /mermaid

ENV NODE_OPTIONS="--max_old_space_size=8192"
ENV npm_config_nodedir="/root/.node-gyp/22.12.0"

EXPOSE 9000 3333