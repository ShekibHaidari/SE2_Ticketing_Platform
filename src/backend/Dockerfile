FROM node:20-alpine AS build

WORKDIR /app

COPY src/backend/package.json src/backend/tsconfig.json ./src/backend/
WORKDIR /app/src/backend
RUN npm install

COPY src/backend ./ 
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/src/backend/package.json ./package.json
COPY --from=build /app/src/backend/node_modules ./node_modules
COPY --from=build /app/src/backend/dist ./dist
COPY database ./database

EXPOSE 3000

CMD ["node", "dist/main.js"]
