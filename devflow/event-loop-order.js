// event-loop-order.js

console.log('1. Synchronous - start');

// Macrotask: ye callback queue mein jaata hai, timer complete hone ke baad
setTimeout(() => {
  console.log('4. setTimeout callback (macrotask)');
}, 0);

// Microtask: Promise resolve hone ke baad iska callback microtask queue mein jaata hai
Promise.resolve().then(() => {
  console.log('3. Promise callback (microtask)');
});

console.log('2. Synchronous - end');

// Expected order: 1, 2, 3, 4
// Reason: synchronous code hamesha pehle chalta hai (call stack).
// Uske baad, event loop pehle SAARI microtasks clear karta hai,
// phir jaake ek macrotask (setTimeout) uthata hai.