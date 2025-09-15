const express = require('express');
const bodyParser = require('body-parser');
const whatsappRoute = require('./routes/whatsapp');

const app = express();

// ✅ Add this line to fix Twilio webhook body parsing
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


app.get('/', (req, res) => {
  res.send('WhatsApp Bot Server is running');
});

app.use('/whatsapp', whatsappRoute);

const PORT = 3500;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
