// config.js
// Ye module sirf environment variables ko ek jagah organize karta hai
// taaki baaki code mein hume baar-baar process.env likhna na pade,
// aur agar env variable ka naam kabhi badle, sirf yahan change karna pade

require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  appName: process.env.APP_NAME || 'MyApp',
  logLevel: process.env.LOG_LEVEL || 'info',
};