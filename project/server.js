const http = require('http');
const config = require('./config');
const logMessage  = require('./logger');

const server = http.createServer((req,res)=>{
  res.end(`Welcome to ${config.appName}`);
});

server.listen(config.port,()=>{
  console.log(`${config.appName} running on port ${config.port}`);
  console.log('Server started');
});