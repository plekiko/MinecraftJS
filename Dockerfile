FROM node:20-alpine AS client
WORKDIR /app
COPY Client/package.json Client/package-lock.json ./
RUN npm ci
COPY Client/ ./
RUN npm run build

FROM httpd
COPY --from=client /app/dist/ /usr/local/apache2/htdocs/
