FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./
COPY database ./database
COPY src/backend ./src/backend
COPY src/lib/store.ts ./src/lib/store.ts
EXPOSE 3000
CMD ["npm", "run", "start:api"]
