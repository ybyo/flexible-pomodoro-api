# Develop stage
FROM node:18-alpine as dev

WORKDIR /app

COPY --chown=node:node package*.json ./

RUN npm i -g @quasar/cli && \
    npm i && \
    npm cache clean --force

COPY --chown=node:node . .

USER node

# Build stage
FROM dev as build

ARG LOCAL
ARG HOST_URL

RUN echo "Currently run build process in '$NODE_ENV_ARG'"

WORKDIR /app

COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=dev /app/node_modules ./node_modules
COPY --chown=node:node . .

USER root

RUN LOCAL=$LOCAL HOST_URL=$HOST_URL quasar build -m pwa --history

FROM nginx:alpine as prod

ARG FRONT_PORT_1
ARG FRONT_PORT_2

COPY --from=build /app/dist/pwa /usr/share/nginx/html
COPY templates/nginx.conf /etc/nginx/templates/nginx.conf.template

EXPOSE ${FRONT_PORT_1} ${FRONT_PORT_2}

CMD ["nginx", "-g", "daemon off;"]
