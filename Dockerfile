FROM node

RUN apt install libimage-exiftool-perl

COPY . .

CMD node index.js
