FROM node:18-alpine as dev
WORKDIR /app
SHELL ["/bin/sh", "-c"]
ENV PNPM_HOME="/app" \
    PATH="$PNPM_HOME:$PATH"

COPY --chown=node:node ./frontend .
COPY --chown=node:node ./env ./env

RUN corepack enable && pnpm --version && \
    pnpm install --prefer-frozen-lockfile --shamefully-hoist --prod=false

USER node

FROM dev as build
WORKDIR /app
SHELL ["/bin/sh", "-c"]
ENV PNPM_HOME="/app" \
    PATH="$PNPM_HOME:$PATH"

ARG ENV_NAME
RUN echo "Currently running build process in '$ENV_NAME'"
COPY --chown=node:node --from=dev /app/node_modules ./node_modules
USER root

RUN corepack enable && pnpm --version && \
    pnpm install -g @quasar/cli && \
    ENV_NAME=$ENV_NAME quasar build -m pwa --history -d all

FROM nginx:alpine as prod

ARG FRONT_PORT_1
ARG FRONT_PORT_2

COPY --from=build /app/dist/pwa /usr/share/nginx/html

EXPOSE $FRONT_PORT_1 $FRONT_PORT_2

CMD ["nginx", "-g", "daemon off;"]
