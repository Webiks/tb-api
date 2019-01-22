FROM buildkite/puppeteer

COPY . .

CMD node index.js
