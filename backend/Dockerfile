FROM node:18-alpine as dev

WORKDIR /app

COPY --chown=node:node ./backend/package*.json ./
COPY --chown=node:node ./package-lock.json ./

RUN npm ci

COPY --chown=node:node ./backend .
USER node

FROM node:18-alpine as build

WORKDIR /app

ARG NODE_ENV

RUN echo "Currently run build process in '$NODE_ENV'"

COPY --chown=node:node ./backend/package*.json ./
COPY --chown=node:node ./package-lock.json ./

COPY --chown=node:node --from=dev /app/node_modules ./node_modules
COPY --chown=node:node ./backend .

RUN npm i -g @nestjs/cli
RUN NODE_ENV=$NODE_ENV nest build

RUN npm ci --only=prod && \
    npm cache clean --force

USER node

FROM node:18-alpine As prod

ARG API_PORT_1
ARG API_PORT_2
ARG API_PORT_3

COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist

EXPOSE $API_PORT_1 $API_PORT_2 $API_PORT_3

CMD [ "node", "dist/main.js" ]
