FROM node:20-alpine AS client
WORKDIR /app
COPY Client/package.json Client/package-lock.json ./
RUN npm ci
COPY Client/ ./

FROM httpd
COPY --from=client /app/ /usr/local/apache2/htdocs/