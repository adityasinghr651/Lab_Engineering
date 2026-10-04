const config = require('../config');

exports.getHome = (req, res) => {
  res.send(`Welcome to ${config.appName} (Powered by Express & MVC)`);
};
