FROM node:4

MAINTAINER Idris

COPY . /app

RUN cd /app; npm install

CMD ["node", "/app/index", "env-file /app/env.list"]
