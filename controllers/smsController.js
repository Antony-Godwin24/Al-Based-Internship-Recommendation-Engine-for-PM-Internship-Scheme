const twilio = require("twilio");
const MessagingResponse = twilio.twiml.MessagingResponse;
const { handleFlow } = require("./sharedFlow");

const handleSMSMessage = async (req, res) => {
  try {
    const phone = req.body.From;
    const message = req.body.Body.trim();

    const replyText = await handleFlow("sms", phone, message);

    const twiml = new MessagingResponse();
    twiml.message(replyText);
    res.type("text/xml").send(twiml.toString());
  } catch (err) {
    console.error("SMS Error:", err);
    res.status(500).send("Server Error");
  }
};

module.exports = { handleSMSMessage };
