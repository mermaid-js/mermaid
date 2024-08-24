FROM node:20.12.2-alpine3.19

USER 0:0

RUN corepack enable \
    && corepack enable pnpm

ENV NODE_OPTIONS="--max_old_space_size=8192"

EXPOSE 9000 3333
