FROM node:22.12.0-alpine3.19@sha256:40dc4b415c17b85bea9be05314b4a753f45a4e1716bb31c01182e6c53d51a654

USER 0:0

# Fix Corepack signature error
RUN npm install -g corepack@latest \
    && corepack enable \
    && corepack prepare pnpm@latest --activate

# Add Build Essentials (Python, G++, Make) + Canvas System Dependencies
RUN apk add --no-cache \
    git~=2.43 \
    python3 \
    make \
    g++ \
    pkgconfig \
    pixman-dev \
    cairo-dev \
    pango-dev \
    libjpeg-turbo-dev \
    giflib-dev \
    && git config --add --system safe.directory /mermaid

# Set pnpm home and store paths for caching
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PATH}:${PNPM_HOME}"
ENV NODE_OPTIONS="--max_old_space_size=8192"

EXPOSE 9000 3333