// controllers/whatsappController.js
const db = require("../db");
const twilio = require("twilio");
const MessagingResponse = twilio.twiml.MessagingResponse;

// ✅ Main controller
const handleWhatsAppMessage = async (req, res) => {
  try {
    console.log("Incoming from Twilio:", req.body);

    let phone = (req.body.From || "test-number").replace("whatsapp:", "");
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
        "INSERT INTO user_state (phone_number, step, lang, context) VALUES (?, ?, ?, ?)",
        [phone, "lang_choice", "en", "{}"]
      );
      state = { step: "lang_choice", lang: "en", context: "{}" }; // ✅ set manually
      replyText = getMsg("en", "lang_options");
    }

    let lang = state?.lang ?? "en";
    let ctx = {};
    try {
      if (state?.context) {
        ctx =
          typeof state.context === "string"
            ? JSON.parse(state.context)
            : state.context; // ✅ safe parse
      }
    } catch (e) {
      console.error("Invalid context JSON:", state?.context);
      ctx = {};
    }

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
        "UPDATE user_state SET step = ?, context = CAST(? AS JSON) WHERE phone_number = ?",
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
          "UPDATE user_state SET step = ?, context = CAST(? AS JSON) WHERE phone_number = ?",
          ["qualification_input", JSON.stringify(ctx), phone]
        );
        replyText = getMsg(lang, "ask_qualification");
      }
    }

    // 5️⃣ Qualification
    else if (state?.step === "qualification_input") {
      ctx.qualification = input;
      await db.execute(
        "UPDATE user_state SET step = ?, context = CAST(? AS JSON) WHERE phone_number = ?",
        ["skill_input", JSON.stringify(ctx), phone]
      );
      replyText = getMsg(lang, "ask_skill");
    }

    // 6️⃣ Skill
    else if (state?.step === "skill_input") {
      ctx.skill = input;
      await db.execute(
        "UPDATE user_state SET step = ?, context = CAST(? AS JSON) WHERE phone_number = ?",
        ["location_input", JSON.stringify(ctx), phone]
      );
      replyText = getMsg(lang, "ask_location");
    }

    // 7️⃣ Location
    else if (state?.step === "location_input") {
      ctx.location = input;
      await db.execute(
        "UPDATE user_state SET step = ?, context = CAST(? AS JSON) WHERE phone_number = ?",
        ["income_input", JSON.stringify(ctx), phone]
      );
      replyText = getMsg(lang, "ask_income");
    }

    // 8️⃣ Income
    else if (state?.step === "income_input") {
      const income = parseInt(input.replace(/[^0-9]/g, "")) || 0;
      if (income > 800000) {
        replyText = getMsg(lang, "income_invalid");
        await db.execute("DELETE FROM user_state WHERE phone_number = ?", [
          phone,
        ]);
      } else {
        ctx.income = income;
        await db.execute(
          "UPDATE user_state SET step = ?, context = CAST(? AS JSON) WHERE phone_number = ?",
          ["eligible", JSON.stringify(ctx), phone]
        );
        replyText =
          getMsg(lang, "eligible") +
          "\n\n" +
          getMsg(lang, "intern_list_header") +
          "\n1️⃣ Zoho - React Intern\n2️⃣ Infosys - Java Intern\n3️⃣ TCS - Python Intern\n\n" +
          getMsg(lang, "match_menu");
      }
    }

    // 9️⃣ After eligibility
    else if (state?.step === "eligible") {
      if (input === "1") {
        replyText = "🔄 More internship options will be available soon!";
      } else if (input === "2") {
        replyText =
          "📄 Full details: Zoho React Intern - Duration 3 months, Stipend ₹15,000/month.";
      } else {
        replyText = "Please reply with a valid option (1 or 2).";
      }
    }

    // Default fallback
    if (!replyText) {
      replyText = "⚠️ Unexpected input. Please start over by typing 'hi'.";
    }

    // ✅ Always return TwiML to Twilio
    const twiml = new MessagingResponse();
    twiml.message(replyText);
    res.type("text/xml").send(twiml.toString());
  } catch (err) {
    console.error("Error in controller:", err);
    res.status(500).send("Server Error");
  }
};

// ✅ Messages
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
      ta: "உங்கள் முதன்மை திறனை உள்ளிடவும் (எ.கா. ரியாக்ட், பைதான்).",
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
