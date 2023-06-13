FROM node:18-alpine as dev

WORKDIR /app

COPY --chown=node:node ./frontend .
COPY --chown=node:node ./package-lock.json .
COPY --chown=node:node ./env ./env

RUN npm i -g @quasar/cli && \
    npm ci && \
    npm cache clean --force

USER node

FROM dev as build

WORKDIR /app

ARG ENV_NAME
ARG LOCAL

RUN echo "Currently running build process in '$ENV_NAME'"

COPY --chown=node:node --from=dev /app/node_modules ./node_modules

USER root

RUN ENV_NAME=$ENV_NAME LOCAL=$LOCAL quasar build -m pwa --history -d all

FROM nginx:alpine as prod

ARG FRONT_PORT_1
ARG FRONT_PORT_2

COPY --from=build /app/dist/pwa /usr/share/nginx/html
COPY /frontend/templates/nginx.conf /etc/nginx/templates/nginx.conf.template

EXPOSE $FRONT_PORT_1 $FRONT_PORT_2

CMD ["nginx", "-g", "daemon off;"]
