FROM node:18

WORKDIR /app

COPY . .

RUN npm install || true

CMD ["node", "index.js"]
