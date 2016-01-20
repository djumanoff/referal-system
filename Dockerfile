FROM node:4

MAINTAINER Idris Djumanov

COPY . /

RUN cd /; npm install -g forever; npm install

CMD ["npm", "start"]
