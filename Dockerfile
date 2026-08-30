FROM node:22-alpine AS build

WORKDIR /app
COPY apps/web/package*.json ./apps/web/
RUN cd apps/web && npm install

COPY apps/web ./apps/web
RUN cd apps/web && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/apps/web/dist ./dist
RUN npm install -g serve

EXPOSE 3000
CMD ["sh", "-c", "npx serve -s dist -l ${PORT:-3000}"]
