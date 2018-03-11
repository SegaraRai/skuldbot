function wah(func, callback) {
  if (!callback) {
    callback = err => {
      if (err) {
        console.error(err);
        return;
      }
    };
  }

  return function (...args) {
    func(...args)
      .then(data => {
        callback(null, data);
      })
      .catch(err => {
        callback(err);
      });
  };
}


module.exports = wah;
