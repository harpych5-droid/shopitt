FROM node:20-alpine

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY frontend /app/frontend

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 