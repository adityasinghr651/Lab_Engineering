// Route parameter — URL ke andar ek dynamic value
// Ye line app.get() se PEHLE honi chahiye — taaki har request pe ye pehle chale
app.use(express.json());

app.post('/echo', (req, res) => {
  // req.body — bina express.json() ke ye undefined hota, aur tumhe
  // Lab 02 jaisa manually req.on('data')/req.on('end') karna padta
  res.json({ youSent: req.body });
});
// Example: /users/42 → yahan 42 ek "parameter" hai jo badal sakta hai
app.get('/users/:id', (req, res) => {
  // req.params — Express automatically URL se parameters nikal ke yahan de deta hai
  const userId = req.params.id;
  res.json({ userId, message: `Fetching user ${userId}` });
});

// Query string — URL ke baad ?key=value wale parts
// Example: /search?name=aditya&page=2
app.get('/search', (req, res) => {
  // req.query — Express automatically query string ko object mein parse kar deta hai
  const { name, page } = req.query;
  res.json({ name, page });
});