FROM node:alpine

WORKDIR /app

COPY public public
COPY src src
COPY package* .

RUN npm install --silent

CMD ["npm", "start"]