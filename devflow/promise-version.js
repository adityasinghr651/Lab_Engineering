// promise-version.js
// Promises isse solve karte hain — chaining se readability improve hoti hai

const fs = require('fs').promises; // Node ka promise-based fs API

fs.readFile('file1.txt', 'utf8')
  .then((data1) => {
    console.log('File 1 read');
    return fs.readFile('file2.txt', 'utf8');
  })
  .then((data2) => {
    console.log('File 2 read');
  })
  .catch((err) => {
    // ek hi jagah pe saari errors catch ho jaati hain — chaahe kisi bhi step mein ho
    console.error('Error:', err);
  });