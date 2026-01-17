FROM node:22.22-alpine3.22@sha256:0c49915657c1c77c64c8af4d91d2f13fe96853bbd957993ed00dd592cbecc284
USER 0:0

RUN corepack enable \
    && corepack enable pnpm

RUN apk add --no-cache git~=2.49 \
    # adding python and build tools for node-gyp dependency. 
    python3 py-setuptools make g++ \
    && git config --add --system safe.directory /mermaid

ENV NODE_OPTIONS="--max_old_space_size=8192"

EXPOSE 9000 3333
