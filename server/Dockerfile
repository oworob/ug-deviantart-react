FROM node:alpine

WORKDIR /app

COPY package* facts.json server.js .

RUN npm install --silent

CMD ["npm", "start"]