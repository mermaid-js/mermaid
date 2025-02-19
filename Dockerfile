FROM node:20.18.1-alpine3.19@sha256:1cc9088b0fbcb2009a8fc2cb57916cd129cd5e32b3c75fb12bb24bac76917a96

USER 0:0

RUN corepack enable \
    && corepack enable pnpm

RUN apk add --no-cache git~=2.43.4 \
    && git config --add --system safe.directory /mermaid

ENV NODE_OPTIONS="--max_old_space_size=8192"

EXPOSE 9000 3333
