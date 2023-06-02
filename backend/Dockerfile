FROM node:18-alpine as dev

WORKDIR /app

COPY --chown=node:node package*.json ./
RUN npm ci
COPY --chown=node:node . .
USER node

FROM node:18-alpine as build

ARG NODE_ENV
ENV ENV_NAME $NODE_ENV

RUN echo "Currently run build process in '$NODE_ENV'"

WORKDIR /app

COPY --chown=node:node package*.json ./

COPY --chown=node:node --from=dev /app/node_modules ./node_modules
COPY --chown=node:node --from=dev /app/public ./public
COPY --chown=node:node . .

RUN NODE_ENV=$NODE_ENV npm run build

RUN npm ci --only=prod && \
    npm cache clean --force

USER node

FROM node:18-alpine As prod

COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/public ./public

EXPOSE 3000

CMD [ "node", "dist/main.js" ]
