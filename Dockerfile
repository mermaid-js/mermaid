FROM node:22-bullseye

USER 0:0

RUN corepack disable \
    && npm install -g pnpm@10.30.3 --force

RUN apt-get update && apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/* \
    && git config --add --system safe.directory /mermaid

WORKDIR /mermaid

ENV NODE_OPTIONS="--max_old_space_size=8192"

EXPOSE 9000 3333