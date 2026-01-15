const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/health', (req, res) => {
  res.send('OK');
});


app.get('/sum', (req, res) => {
  const a = req.query.a;
  const b = req.query.b;
  res.send(a + b);
});



app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});