const twilio = require("twilio");
const VoiceResponse = twilio.twiml.VoiceResponse;
const { handleFlow } = require("./sharedFlow");

const handleIVRInput = async (req, res) => {
  try {
    const phone = req.body.From;
    const message = req.body.SpeechResult || req.body.Digits || "";

    const replyText = await handleFlow("ivr", phone, message);

    const twiml = new VoiceResponse();
    twiml.say(replyText);  // You can customize voice/language here
    twiml.redirect("/ivr"); // Optional: redirect to continue conversation
    res.type("text/xml").send(twiml.toString());
  } catch (err) {
    console.error("IVR Error:", err);
    res.status(500).send("Server Error");
  }
};

module.exports = { handleIVRInput };
