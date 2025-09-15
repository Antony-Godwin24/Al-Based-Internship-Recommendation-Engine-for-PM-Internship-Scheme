const db = require("../db");
const twilio = require("twilio");
const MessagingResponse = twilio.twiml.MessagingResponse;

const handleWhatsAppMessage = async (req, res) => {
  try {
    console.log("Incoming from Twilio:", req.body);

    const phone = req.body.From || "test-number";
    const message = req.body.Body || "1";
    const input = message.trim();

    // Get current user state
    const [rows] = await db.execute(
      "SELECT * FROM user_state WHERE phone_number = ?",
      [phone]
    );
    let state = rows[0] || null;

    let replyText = "";

    // 1️⃣ Start: Language selection
    if (!state) {
      await db.execute(
        "INSERT INTO user_state (phone_number, step) VALUES (?, ?)",
        [phone, "lang_choice"]
      );
      replyText = getMsg("en", "lang_options");
    }

    const lang = state?.lang ?? "en";
    const ctx =
      state?.context && typeof state.context === "string"
        ? JSON.parse(state.context)
        : {};

    // 2️⃣ Language choice
    if (state?.step === "lang_choice") {
      let chosenLang = "en";
      if (input === "1") chosenLang = "ta";
      else if (input === "2") chosenLang = "hi";
      else if (input === "3") chosenLang = "en";

      await db.execute(
        "UPDATE user_state SET step = ?, lang = ? WHERE phone_number = ?",
        ["name_input", chosenLang, phone]
      );
      replyText = getMsg(chosenLang, "ask_name");
    }

    // 3️⃣ Name input
    else if (state?.step === "name_input") {
      ctx.name = input ?? null;
      await db.execute(
        "UPDATE user_state SET step = ?, context = ? WHERE phone_number = ?",
        ["age_input", JSON.stringify(ctx), phone]
      );
      replyText = getMsg(lang, "ask_age");
    }

    // 4️⃣ Age input
    else if (state?.step === "age_input") {
      const age = parseInt(input);
      if (isNaN(age) || age < 21 || age > 24) {
        replyText = getMsg(lang, "age_invalid");
      } else {
        ctx.age = age;
        await db.execute(
          "UPDATE user_state SET step = ?, context = ? WHERE phone_number = ?",
          ["qualification_input", JSON.stringify(ctx), phone]
        );
        replyText = getMsg(lang, "ask_qualification");
      }
    }

    // ... (continue same flow, but always assign to `replyText` instead of res.json)

    //  ✅ Always return TwiML to Twilio
    const twiml = new MessagingResponse();
    twiml.message(replyText || "Unexpected input. Please start over.");
    res.type("text/xml").send(twiml.toString());
  } catch (err) {
    console.error("Error in controller:", err);
    res.status(500).send("Server Error");
  }
};

// keep your getMsg() same

// Messages (same as before)
function getMsg(lang, key) {
  const messages = {
    lang_options: {
      en: "Welcome! Choose your language:\n1️⃣ Tamil\n2️⃣ Hindi\n3️⃣ English",
      ta: "வரவேற்கிறோம்! உங்கள் மொழியை தேர்ந்தெடுக்கவும்:\n1️⃣ தமிழ்\n2️⃣ இந்தி\n3️⃣ ஆங்கிலம்",
      hi: "स्वागत है! अपनी भाषा चुनें:\n1️⃣ तमिल\n2️⃣ हिंदी\n3️⃣ अंग्रेज़ी",
    },
    ask_name: {
      en: "Please enter your full name.",
      ta: "தயவுசெய்து உங்கள் முழு பெயரை உள்ளிடுங்கள்.",
      hi: "कृपया अपना पूरा नाम दर्ज करें।",
    },
    ask_age: {
      en: "Enter your age (21–24 only eligible).",
      ta: "உங்கள் வயதை உள்ளிடுங்கள் (21–24 வயது மட்டுமே தகுதி பெறும்).",
      hi: "अपनी आयु दर्ज करें (केवल 21–24 वर्ष योग्य हैं)।",
    },
    age_invalid: {
      en: "Sorry, you are not eligible. Age must be between 21 and 24.",
      ta: "மன்னிக்கவும், நீங்கள் தகுதியற்றவராக இருக்கிறீர்கள். வயது 21 முதல் 24 வரை இருக்க வேண்டும்.",
      hi: "क्षमा करें, आप पात्र नहीं हैं। आयु 21 से 24 के बीच होनी चाहिए।",
    },
    ask_qualification: {
      en: "Enter your highest qualification (e.g., B.E CSE, B.Sc IT).",
      ta: "உங்கள் கல்வித் தகுதியை உள்ளிடவும் (எ.கா. பி.இ., பி.எஸ்சி ஐடி).",
      hi: "अपनी उच्चतम योग्यता दर्ज करें (जैसे बीई सीएसई, बीएससी आईटी)।",
    },
    ask_skill: {
      en: "Enter your primary skill (e.g., React, Python, Java, etc).",
      ta: "உங்கள் முதன்மை திறனை உள்ளிடவும் (எ.கா. ரியாக்ட், பைதான்)",
      hi: "अपना मुख्य कौशल दर्ज करें (जैसे रिएक्ट, पायथन, जावा)।",
    },
    ask_location: {
      en: "Enter your preferred city or location.",
      ta: "நீங்கள் விரும்பும் நகரத்தையோ இடத்தையோ உள்ளிடவும்.",
      hi: "अपना पसंदीदा शहर या स्थान दर्ज करें।",
    },
    ask_income: {
      en: "Enter your family’s annual income in INR.",
      ta: "உங்கள் குடும்பத்தின் வருடாந்த வருமானத்தை ரூபாயில் உள்ளிடவும்.",
      hi: "अपने परिवार की वार्षिक आय (INR में) दर्ज करें।",
    },
    income_invalid: {
      en: "Sorry, you are not eligible. Income must be under ₹8,00,000.",
      ta: "மன்னிக்கவும், உங்கள் வருமானம் ₹8,00,000 க்கும் குறைவாக இருக்க வேண்டும்.",
      hi: "क्षमा करें, आपकी आय ₹8,00,000 से कम होनी चाहिए।",
    },
    eligible: {
      en: "✅ You are eligible! Fetching internships for you...",
      ta: "✅ நீங்கள் தகுதியுடையவர்! உங்களுக்கான இண்டர்ன்ஷிப்புகள் தேடப்படுகின்றன...",
      hi: "✅ आप पात्र हैं! आपके लिए इंटर्नशिप खोजी जा रही है...",
    },
    intern_list_header: {
      en: "🎯 Top Internship Matches Based on Your Profile:",
      ta: "🎯 உங்கள் விவரங்களின் அடிப்படையில் சிறந்த இண்டர்ன்ஷிப்புகள்:",
      hi: "🎯 आपकी प्रोफ़ाइल के आधार पर शीर्ष इंटर्नशिप:",
    },
    match_menu: {
      en: "Reply 1️⃣ to see more\nReply 2️⃣ to get full details about one",
      ta: "மேலும் காண 1️⃣ அனுப்பவும்\nமுழு விவரங்களுக்கு 2️⃣ அனுப்பவும்",
      hi: "और देखने के लिए 1️⃣ भेजें\nपूरा विवरण पाने के लिए 2️⃣ भेजें",
    },
  };
  return messages[key]?.[lang] || messages[key]?.en || "Message not available.";
}

module.exports = { handleWhatsAppMessage };
