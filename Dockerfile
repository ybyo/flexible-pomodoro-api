FROM node:18-alpine as dev

ARG NODE_ENV=dev
ENV ENV_NAME $NODE_ENV

RUN echo "Currently run build process in '$ENV_NAME'"

WORKDIR /app
# Copying this first prevents re-running npm install on every code change.
COPY --chown=node:node package*.json ./
RUN npm ci
COPY --chown=node:node . .
# To prevent security threats, avoid working as a root and use the default 'node' user provided in the node image.
USER node

FROM node:18-alpine as build

ARG NODE_ENV=dev
ENV ENV_NAME $NODE_ENV

WORKDIR /app

COPY --chown=node:node package*.json ./
# We can copy over the node_modules directory from the development image
COPY --chown=node:node --from=dev /app/node_modules ./node_modules
COPY --chown=node:node . .

RUN NODE_ENV=$ENV_NAME npm run build

# Running `npm ci` removes the existing node_modules directory and
# passing in --only=prod ensures that only the production dependencies are installed.
# This ensures that the node_modules directory is as optimized as possible
RUN npm ci --only=prod && \
    npm cache clean --force

USER node

FROM node:18-alpine As prod

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/public ./public

EXPOSE 3000

# Start the server using the production build
CMD [ "node", "dist/main.js" ]
