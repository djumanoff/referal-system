FROM tatsushid/tinycore-node:5.7

# FROM node:4

MAINTAINER Idris Djumanov

COPY . /

WORKDIR /app

RUN npm install -g forever

RUN npm install

CMD ["npm", "start"]
