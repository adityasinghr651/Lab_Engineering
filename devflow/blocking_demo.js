console.log('1. Start');

function blockingTask(){
  const start = Date.now();
  while(Date.now() - start <3000){

  }
  console.log('2. Blocking task done');
}

blockingTask();

console.log('3. End');