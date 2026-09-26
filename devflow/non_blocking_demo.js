console.log('1. Start');

setTimeout(() => {
  console.log('2. This run after 3 seconds , but non-blocking');
},3000);

console.log('3. End')