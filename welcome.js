let fn = function* () {
  let data = [1, 2, 3, 4, 5, 6];
  for (let i of data) {
    yield i;
    console.log('iaeee');
  }
};

const a = fn();
while (true) {
  const b = a.next();
  if (b.done) {
    break;
  }
  console.log(b.value);
}
