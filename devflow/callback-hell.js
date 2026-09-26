// callback-hell-example.js
// Purana style: nested callbacks — isse "callback hell" kehte hain
// Real problem: code padhna mushkil, error handling messy, debugging painful

const fs = require('fs');

fs.readFile('file1.txt', 'utf8', (err1, data1) => {
  if (err1) return console.error(err1);
  console.log('File 1 read');

  fs.readFile('file2.txt', 'utf8', (err2, data2) => {
    if (err2) return console.error(err2);
    console.log('File 2 read');
    // aur agar 3rd, 4th file bhi honi, toh nesting aur badhti jaati — "pyramid of doom"
  });
});