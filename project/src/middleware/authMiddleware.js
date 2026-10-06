function checkApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== 'secret123') {
    // next() CALL NAHI kiya — isliye request yahin ruk jayegi
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next(); // sahi key hai, aage badho
}

module.exports = { checkApiKey };
