FROM node:20.12.2-alpine3.19 AS base
RUN apk --no-cache add openssl wget
RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.shrc" SHELL="$(which sh)" sh -
