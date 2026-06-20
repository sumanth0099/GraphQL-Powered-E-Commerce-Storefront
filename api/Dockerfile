FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

EXPOSE 4000

RUN apk add --no-cache curl

CMD ["node", "src/index.js"]
