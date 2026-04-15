# --------------------------------------------
# DEVELOPMENT STAGE
# --------------------------------------------
FROM node:20-alpine AS development

WORKDIR /home/app

# Build args (token is passed during docker build)
ARG GITHUB_ACCESS_TOKEN=

# Install git because GitHub Packages requires git for some installs
RUN apk add --no-cache git

# Ensure correct permissions
RUN mkdir -p /home/app/node_modules && chown -R node:node /home/app

# Copy package files first (layer caching)
COPY package*.json ./

# Switch to non-root user
USER node

# Add GitHub token to .npmrc INSIDE the container
RUN echo //npm.pkg.github.com/:_authToken=$GITHUB_ACCESS_TOKEN >> ~/.npmrc
RUN echo "@justkel:registry=https://npm.pkg.github.com" >> ~/.npmrc

# Install dependencies
RUN yarn install --ignore-engines --network-timeout 100000

# Copy full project
COPY --chown=node:node . .

RUN chmod +x ./node_modules/.bin/*

# Build the code
RUN yarn build



# --------------------------------------------
# PRODUCTION STAGE
# --------------------------------------------
FROM node:20-alpine AS production

WORKDIR /home/app

ARG NODE_ENV=production
ARG GITHUB_ACCESS_TOKEN=

ENV NODE_ENV=${NODE_ENV}

# Install git again (required for GitHub registry)
RUN apk add --no-cache git

RUN mkdir -p /home/app/node_modules && chown -R node:node /home/app

COPY package*.json ./

USER node

# Add GitHub token + registry inside production image
RUN echo //npm.pkg.github.com/:_authToken=$GITHUB_ACCESS_TOKEN >> ~/.npmrc
RUN echo "@justkel:registry=https://npm.pkg.github.com" >> ~/.npmrc

# Install only production dependencies
RUN yarn install --ignore-engines --production --network-timeout 100000

# Copy source + dist build
COPY --chown=node:node . .
COPY --from=development --chown=node:node /home/app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "yarn start:prod"]
