const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const { handleWhatsAppMessage } = require("./controllers/whatsappController");
const { handleSMSMessage } = require("./controllers/smsController");
const { handleIVRInput } = require("./controllers/ivrController");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
app.post("/whatsapp", handleWhatsAppMessage);
app.post("/sms", handleSMSMessage);
app.post("/ivr", handleIVRInput);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
