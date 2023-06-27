FROM node:18-alpine as dev

WORKDIR /app

COPY --chown=node:node ./backend/package*.json ./
COPY --chown=node:node ./package-lock.json ./

RUN npm i

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

RUN npm i --only=prod && \
    npm cache clean --force

USER node

FROM node:18-alpine As prod

ARG API_PORT_0

COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
RUN npm install pm2 -g

EXPOSE $API_PORT_0

CMD [ "pm2-runtime", "start", "dist/main.js" ]
