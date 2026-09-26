// async-await-version.js
// async/await — Promises ka hi "syntactic sugar", lekin synchronous jaisa dikhta/padhta hai

const fs = require('fs').promises;

// async keyword function ko batata hai: "ye function ek Promise return karega"
async function readFiles() {
  try {
    // await ka matlab: "yahan ruk jao jab tak ye Promise resolve na ho,
    // lekin poore thread ko block mat karo — sirf is function ke andar wait karo"
    const data1 = await fs.readFile('file1.txt', 'utf8');
    console.log('File 1 read');

    const data2 = await fs.readFile('file2.txt', 'utf8');
    console.log('File 2 read');
  } catch (err) {
    // try/catch se error handling normal synchronous code jaisi lagti hai
    console.error('Error:', err);
  }
}

readFiles();