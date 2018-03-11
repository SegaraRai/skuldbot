const wah = require('./lib/wah');


async function main() {
  // initialize
  for (const file of [
    './lib/mongoClient',
  ]) {
    console.log(`initializing ${file}`);
    const m = require(file);
    if (m && typeof m.init === 'function') {
      await m.init();
    }
  }

  // run
  for (const file of [
    './watch-gacha',
    './watch-tag',
  ]) {
    console.log(`starting ${file}`);
    const m = require(file);
    if (typeof m === 'function') {
      await m();
    }
  }
}


wah(main, err => {
  if (err) {
    throw err;
  }

  console.log('started');

  setInterval(() => {
    console.log('running...');
  }, 20 * 60 * 1000);
})();
