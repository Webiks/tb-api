FROM perl
FROM node

ENV EXIFTOOL_VERSION=10.61

RUN wget http://www.sno.phy.queensu.ca/~phil/exiftool/Image-ExifTool-${EXIFTOOL_VERSION}.tar.gz \
    && tar xvf Image-ExifTool-${EXIFTOOL_VERSION}.tar.gz \
    && cd Image-ExifTool-${EXIFTOOL_VERSION} \
    && perl Makefile.PL \
    && make && make test && make install \
    && rm -rf Image-ExifTool-${EXIFTOOL_VERSION}

WORKDIR app

COPY . .

RUN npm cache clean -f

RUN npm install

CMD node index
