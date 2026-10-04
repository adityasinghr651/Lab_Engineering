// const math = require('./math');
// console.log(math.add(2,2));
// console.log(math.subtract(2,3));

require('dotenv').config();

const port = process.env.PORT || 3000;// agar .env mein na mile toh default 3000 use karo
console.log(`Server will run on port ${port}`);
console.log(`Environment: ${process.env.NODE_ENV}`);