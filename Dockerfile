FROM node

ENV EXIFTOOL_VERSION=10.61

RUN apt update && apt -y install libimage-exiftool-perl

WORKDIR app

COPY . .

RUN mkdir tmp && npm cache clean -f

RUN npm install

CMD npm run start:prod
