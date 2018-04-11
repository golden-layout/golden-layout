module.exports = fn =>
  new Promise(resolve => {
    const interval = setInterval(() => {
      const result = fn();
      if (result) {
        resolve();
        clearInterval(interval);
      }
    }, 50);
  });
