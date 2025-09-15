const db = require("../db");
const twilio = require("twilio");
const MessagingResponse = twilio.twiml.MessagingResponse;

const handleWhatsAppMessage = async (req, res) => {
  try {
    console.log("Incoming from Twilio:", req.body);

    const phone = (req.body.From || "test-number").replace("whatsapp:", "");
    const message = (req.body.Body || "").trim();

    // 1️⃣ Fetch user state from DB
    let state = null;
    try {
      const [rows] = await db.execute("SELECT * FROM user_state WHERE phone_number = ?", [phone]);
      state = rows[0] || null;
    } catch (e) {
      console.error("DB fetch error:", e);
    }

    // 2️⃣ Initialize reply text
    let replyText = "";

    // 3️⃣ Initialize context
    let ctx = {};
    if (state?.context) {
      try {
        ctx = typeof state.context === "string" ? JSON.parse(state.context) : state.context;
      } catch (e) {
        console.error("Invalid context JSON:", state.context);
        ctx = {};
      }
    }

    // 4️⃣ Default language
    let lang = state?.lang || "en";

    // -------------------------------
    // FLOW LOGIC
    // -------------------------------

    // 1️⃣ No state → greeting + lang selection
    if (!state) {
      state = { phone_number: phone, step: "lang_choice", lang: "en", context: "{}" };
      try {
        await db.execute(
          "INSERT INTO user_state (phone_number, step, lang, context) VALUES (?, ?, ?, ?)",
          [phone, state.step, state.lang, state.context]
        );
      } catch (e) {
        console.error("DB insert error:", e);
      }
      replyText = getMsg("en", "lang_options");
    }

    // 2️⃣ Language choice
    else if (state.step === "lang_choice") {
      if (message === "1") lang = "ta";
      else if (message === "2") lang = "hi";
      else lang = "en";

      state.step = "name_input";
      state.lang = lang;
      try {
        await db.execute(
          "UPDATE user_state SET step = ?, lang = ? WHERE phone_number = ?",
          [state.step, state.lang, phone]
        );
      } catch (e) {
        console.error("DB update error:", e);
      }
      replyText = getMsg(lang, "ask_name");
    }

    // 3️⃣ Name input
    else if (state.step === "name_input") {
      ctx.name = message;
      state.step = "age_input";
      state.context = JSON.stringify(ctx);
      try {
        await db.execute(
          "UPDATE user_state SET step = ?, context = CAST(? AS JSON) WHERE phone_number = ?",
          [state.step, state.context, phone]
        );
      } catch (e) {
        console.error("DB update error:", e);
      }
      replyText = getMsg(lang, "ask_age");
    }

    // 4️⃣ Age input
    else if (state.step === "age_input") {
      const age = parseInt(message);
      if (isNaN(age) || age < 21 || age > 24) {
        replyText = getMsg(lang, "age_invalid");
        try {
          await db.execute("DELETE FROM user_state WHERE phone_number = ?", [phone]);
        } catch (e) {
          console.error("DB delete error:", e);
        }
      } else {
        ctx.age = age;
        state.step = "job_input";
        state.context = JSON.stringify(ctx);
        try {
          await db.execute(
            "UPDATE user_state SET step = ?, context = CAST(? AS JSON) WHERE phone_number = ?",
            [state.step, state.context, phone]
          );
        } catch (e) {
          console.error("DB update error:", e);
        }
        replyText = getMsg(lang, "ask_job");
      }
    }

    // 5️⃣ Current job / internship
    else if (state.step === "job_input") {
      ctx.current_job = message;
      state.step = "govt_intern_input";
      state.context = JSON.stringify(ctx);
      try {
        await db.execute(
          "UPDATE user_state SET step = ?, context = CAST(? AS JSON) WHERE phone_number = ?",
          [state.step, state.context, phone]
        );
      } catch (e) {
        console.error("DB update error:", e);
      }
      replyText = getMsg(lang, "ask_govt_intern");
    }

    // 6️⃣ Govt internship history
    else if (state.step === "govt_intern_input") {
      if (message.toLowerCase() === "yes") {
        replyText = getMsg(lang, "govt_intern_not_eligible");
        try {
          await db.execute("DELETE FROM user_state WHERE phone_number = ?", [phone]);
        } catch (e) {
          console.error("DB delete error:", e);
        }
      } else {
        ctx.govt_intern = message;
        state.step = "qualification_input";
        state.context = JSON.stringify(ctx);
        try {
          await db.execute(
            "UPDATE user_state SET step = ?, context = CAST(? AS JSON) WHERE phone_number = ?",
            [state.step, state.context, phone]
          );
        } catch (e) {
          console.error("DB update error:", e);
        }
        replyText = getMsg(lang, "ask_qualification");
      }
    }

    // 7️⃣ Qualification
    else if (state.step === "qualification_input") {
      ctx.qualification = message;
      state.step = "skill_input";
      state.context = JSON.stringify(ctx);
      try {
        await db.execute(
          "UPDATE user_state SET step = ?, context = CAST(? AS JSON) WHERE phone_number = ?",
          [state.step, state.context, phone]
        );
      } catch (e) {
        console.error("DB update error:", e);
      }
      replyText = getMsg(lang, "ask_skill");
    }

    // 8️⃣ Skill
    else if (state.step === "skill_input") {
      ctx.skill = message;
      state.step = "location_input";
      state.context = JSON.stringify(ctx);
      try {
        await db.execute(
          "UPDATE user_state SET step = ?, context = CAST(? AS JSON) WHERE phone_number = ?",
          [state.step, state.context, phone]
        );
      } catch (e) {
        console.error("DB update error:", e);
      }
      replyText = getMsg(lang, "ask_location");
    }

    // 9️⃣ Location
    else if (state.step === "location_input") {
      ctx.location = message;
      state.step = "eligible";
      state.context = JSON.stringify(ctx);

      try {
        await db.execute(
          "INSERT INTO applicants (phone_number, name, age, qualification, skill, location, lang) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [phone, ctx.name, ctx.age, ctx.qualification, ctx.skill, ctx.location, lang]
        );

        const [internships] = await db.execute("SELECT * FROM internships LIMIT 3");
        ctx.internships = internships;
        ctx.page = 0;
        state.context = JSON.stringify(ctx);

        await db.execute(
          "UPDATE user_state SET step = ?, context = CAST(? AS JSON) WHERE phone_number = ?",
          [state.step, state.context, phone]
        );

        replyText =
          getMsg(lang, "eligible") +
          "\n\n" +
          formatInternList(internships) +
          "\n" +
          getMsg(lang, "match_menu");
      } catch (e) {
        console.error("DB error:", e);
        replyText = "⚠️ Something went wrong. Please try again later.";
      }
    }

    // 🔟 After eligibility
    else if (state.step === "eligible") {
      ctx.page = ctx.page || 0;
      ctx.internships = ctx.internships || [];

      if (message === "1") {
        const offset = (ctx.page + 1) * 3;
        try {
          const [nextInterns] = await db.execute(`SELECT * FROM internships LIMIT ${offset}, 3`);
          if (nextInterns.length === 0) replyText = "🔄 No more internships available.";
          else {
            ctx.page += 1;
            ctx.internships = nextInterns;
            state.context = JSON.stringify(ctx);
            await db.execute(
              "UPDATE user_state SET context = CAST(? AS JSON) WHERE phone_number = ?",
              [state.context, phone]
            );
            replyText = formatInternList(nextInterns) + "\n" + getMsg(lang, "match_menu");
          }
        } catch (e) {
          console.error("DB error:", e);
          replyText = "⚠️ Something went wrong. Please try again later.";
        }
      } else if (message === "2") {
        state.step = "select_intern";
        try {
          await db.execute("UPDATE user_state SET step = ? WHERE phone_number = ?", [state.step, phone]);
        } catch (e) {
          console.error("DB update error:", e);
        }
        replyText = "Which one do you want details for? (1/2/3)";
      } else {
        replyText = "Please reply with 1 or 2.";
      }
    }

    // 11️⃣ Select internship
    else if (state.step === "select_intern") {
      const idx = parseInt(message) - 1;
      if (isNaN(idx) || idx < 0 || idx >= (ctx.internships?.length || 0)) {
        replyText = "Invalid choice. Reply 1, 2, or 3";
      } else {
        const intern = ctx.internships[idx];
        replyText = `📄 ${intern.company} - ${intern.title}\nLocation: ${intern.location}\nSkills Required: ${intern.skills_required}\nDuration: ${intern.duration}\nStipend: ${intern.stipend}\n\nPlease provide your feedback.`;

        state.step = "feedback_input";
        try {
          await db.execute("UPDATE user_state SET step = ? WHERE phone_number = ?", [state.step, phone]);
        } catch (e) {
          console.error("DB update error:", e);
        }
      }
    }

    // 12️⃣ Feedback
    else if (state.step === "feedback_input") {
      ctx.feedback = message;
      try {
        await db.execute("UPDATE applicants SET feedback = ? WHERE phone_number = ?", [message, phone]);
        await db.execute("DELETE FROM user_state WHERE phone_number = ?", [phone]);
      } catch (e) {
        console.error("DB error:", e);
      }
      replyText = "Thank you 🙏 for your feedback!";
    }

    // Default fallback
    if (!replyText) replyText = "⚠️ Unexpected input. Please start over by typing 'hi'.";

    // -------------------------------
    // SEND RESPONSE
    // -------------------------------
    console.log("Replying:", replyText);
    const twiml = new MessagingResponse();
    twiml.message(replyText);
    res.type("text/xml").send(twiml.toString());
  } catch (err) {
    console.error("Error in controller:", err);
    res.status(500).send("Server Error");
  }
};

// -------------------------------
// Helper functions
// -------------------------------
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
    ask_job: {
      en: "Do you have any current job or internship?",
      ta: "உங்களுக்கு தற்போதைய வேலை அல்லது இன்டர்ன்ஷிப் உள்ளதா?",
      hi: "क्या आपके पास वर्तमान में कोई नौकरी या इंटर्नशिप है?",
    },
    ask_govt_intern: {
      en: "Have you done any govt internship before? (yes/no)",
      ta: "நீங்கள் ஏற்கனவே எந்த அரசாங்க இன்டர்ன்ஷிப் செய்தீர்களா? (ஆம்/இல்லை)",
      hi: "क्या आपने पहले कोई सरकारी इंटर्नशिप की है? (हाँ/नहीं)",
    },
    govt_intern_not_eligible: {
      en: "Sorry, you are not eligible as you have done a govt internship.",
      ta: "மன்னிக்கவும், நீங்கள் அரசு இன்டர்ன்ஷிப் செய்ததால் தகுதியற்றவர்.",
      hi: "क्षमा करें, आपने सरकारी इंटर्नशिप की होने के कारण आप पात्र नहीं हैं।",
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
    eligible: {
      en: "✅ You are eligible! Fetching internships for you...",
      ta: "✅ நீங்கள் தகுதியுடையவர்! உங்களுக்கான இண்டர்ன்ஷிப்புகள் தேடப்படுகின்றன...",
      hi: "✅ आप पात्र हैं! आपके लिए इंटर्नशिप खोजी जा रही है...",
    },
    match_menu: {
      en: "Reply 1️⃣ to see more\nReply 2️⃣ to get full details about one",
      ta: "மேலும் காண 1️⃣ அனுப்பவும்\nமுழு விவரங்களுக்கு 2️⃣ அனுப்பவும்",
      hi: "और देखने के लिए 1️⃣ भेजें\nपूरा विवरण पाने के लिए 2️⃣ भेजें",
    },
  };
  return messages[key]?.[lang] || messages[key]?.en || "Message not available.";
}

function formatInternList(interns) {
  return interns.map((i, idx) => `${idx + 1}️⃣ ${i.company} - ${i.title}`).join("\n");
}

module.exports = { handleWhatsAppMessage };
