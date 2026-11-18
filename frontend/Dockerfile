FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-entrypoint.sh /docker-entrypoint.d/40-applyflow-backend.sh
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
RUN chmod +x /docker-entrypoint.d/40-applyflow-backend.sh
EXPOSE 80
