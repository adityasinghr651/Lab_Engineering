// src/app.js
// App ka core setup — abhi plain http module ke saath

const http = require('http');
const { handleRequest } = require('./routes');

// http.createServer ko hum yahan "app" bana rahe hain,
// taaki server.js isko sirf start kare, logic yahan rahe
const app = http.createServer(handleRequest);

module.exports = app;