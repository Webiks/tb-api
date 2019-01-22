FROM dylansm/exiftool
FROM node

COPY . .

CMD node index.js
