// sharedFlow.js
const db = require("../db");
const getMsg = require("../utils/getMsg.js");
const formatInternList = require("../utils/formatInternList");

// Helper: update user_state easily
async function updateState(phone, step, ctx = null, lang = null) {
  const fields = [];
  const values = [];

  if (step) {
    fields.push("step = ?");
    values.push(step);
  }
  if (ctx !== null) {
    fields.push("context = CAST(? AS JSON)");
    values.push(JSON.stringify(ctx));
  }
  if (lang) {
    fields.push("lang = ?");
    values.push(lang);
  }

  if (fields.length > 0) {
    values.push(phone);
    const sql = `UPDATE user_state SET ${fields.join(", ")} WHERE phone_number = ?`;
    await db.execute(sql, values);
  }
}

async function handleFlow(channel, phone, message) {
  // 1️⃣ Fetch user state
  let state = null;
  try {
    const [rows] = await db.execute("SELECT * FROM user_state WHERE phone_number = ?", [phone]);
    state = rows[0] || null;
  } catch (e) {
    console.error("DB fetch error:", e);
  }

  // 2️⃣ Initialize reply and context
  let replyText = "";
  let ctx = {};
  if (state?.context) {
    try {
      ctx = typeof state.context === "string" ? JSON.parse(state.context) : state.context;
    } catch (e) {
      console.error("Invalid context JSON:", state.context);
      ctx = {};
    }
  }

  // 3️⃣ Current language
  let lang = state?.lang || "en";

  // -------------------------------
  // FLOW LOGIC
  // -------------------------------

  // Initial state: ask language
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

  // Language choice
  else if (state.step === "lang_choice") {
    if (message === "1") lang = "ta";
    else if (message === "2") lang = "hi";
    else if (message === "3") lang = "en";
    else {
      replyText = getMsg("en", "lang_options") + "\n❌ Invalid choice. Please select 1, 2, or 3.";
      return replyText;
    }

    state.step = "name_input";
    state.lang = lang;
    await updateState(phone, state.step, null, lang);
    replyText = getMsg(lang, "ask_name");
  }

  // Name input
  else if (state.step === "name_input") {
    ctx.name = message.trim();
    state.step = "age_input";
    await updateState(phone, state.step, ctx);
    replyText = getMsg(lang, "ask_age");
  }

  // Age input
  else if (state.step === "age_input") {
    const age = parseInt(message);
    if (isNaN(age) || age < 21 || age > 24) {
      replyText = getMsg(lang, "age_invalid");
      await db.execute("DELETE FROM user_state WHERE phone_number = ?", [phone]);
    } else {
      ctx.age = age;
      state.step = "income_input";
      await updateState(phone, state.step, ctx);
      replyText = getMsg(lang, "ask_income");
    }
  }

  // Income input
  else if (state.step === "income_input") {
    const income = parseFloat(message.replace(/[^0-9.]/g, ""));
    if (isNaN(income) || income > 800000) {
      replyText = getMsg(lang, "income_invalid");
      await db.execute("DELETE FROM user_state WHERE phone_number = ?", [phone]);
    } else {
      ctx.income = income;
      state.step = "job_input";
      await updateState(phone, state.step, ctx);
      replyText = getMsg(lang, "ask_job");
    }
  }

  // Job input
  else if (state.step === "job_input") {
    ctx.current_job = message.trim();
    state.step = "govt_intern_input";
    await updateState(phone, state.step, ctx);
    replyText = getMsg(lang, "ask_govt_intern");
  }

  // Government internship input
  else if (state.step === "govt_intern_input") {
    if (message.toLowerCase() === "yes") {
      replyText = getMsg(lang, "govt_intern_not_eligible");
      await db.execute("DELETE FROM user_state WHERE phone_number = ?", [phone]);
    } else if (message.toLowerCase() === "no") {
      ctx.govt_intern = message.trim();
      state.step = "qualification_input";
      await updateState(phone, state.step, ctx);
      replyText = getMsg(lang, "ask_qualification");
    } else {
      replyText = "❌ Please reply with 'yes' or 'no'.";
    }
  }

  // Qualification input
  else if (state.step === "qualification_input") {
    ctx.qualification = message.trim();
    state.step = "skill_input";
    await updateState(phone, state.step, ctx);
    replyText = getMsg(lang, "ask_skill");
  }

  // Skill input
  else if (state.step === "skill_input") {
    ctx.skill = message.trim();
    state.step = "location_input";
    await updateState(phone, state.step, ctx);
    replyText = getMsg(lang, "ask_location");
  }

  // Location input
  else if (state.step === "location_input") {
    ctx.location = message.trim();
    state.step = "eligible";

    try {
      await db.execute(
        "INSERT INTO applicants (phone_number, name, age, income, qualification, skill, location, lang) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [phone, ctx.name, ctx.age, ctx.income, ctx.qualification, ctx.skill, ctx.location, lang]
      );

      const [internships] = await db.execute("SELECT * FROM internships LIMIT 3");
      ctx.internships = internships;
      ctx.page = 0;
      await updateState(phone, state.step, ctx);

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

  // Eligible / match menu
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
          await updateState(phone, null, ctx);
          replyText = formatInternList(nextInterns) + "\n" + getMsg(lang, "match_menu");
        }
      } catch (e) {
        console.error("DB error:", e);
        replyText = "⚠️ Something went wrong. Please try again later.";
      }
    } else if (message === "2") {
      state.step = "select_intern";
      await updateState(phone, state.step);
      replyText = getMsg(lang, "select_intern");
    } else {
      replyText = "❌ Please reply with 1 or 2.";
    }
  }

  // Select internship
  // In "Select internship" step
else if (state.step === "select_intern") {
  const idx = parseInt(message) - 1;
  if (isNaN(idx) || idx < 0 || idx >= (ctx.internships?.length || 0)) {
    replyText = "❌ Invalid choice. Reply 1, 2, or 3";
  } else {
    const intern = ctx.internships[idx];
    ctx.selectedInternId = intern.id; // track selected internship
    replyText = `📄 ${intern.company} - ${intern.title}\nLocation: ${intern.location}\nSkills Required: ${intern.skills_required}\nDuration: ${intern.duration}\nStipend: ${intern.stipend}\n\n` + getMsg(lang, "feedback");

    state.step = "feedback_input";
    await updateState(phone, state.step, ctx);

    // Update the applicant with selected internship
    await db.execute(
      "UPDATE applicants SET selected_internship_id = ?, registered = 1 WHERE phone_number = ?",
      [intern.id, phone]
    );
  }
}


  // Feedback input
  else if (state.step === "feedback_input") {
  ctx.feedback = message.trim();
  try {
    // Option 1: Save feedback in applicants table
    await db.execute(
      "UPDATE applicants SET feedback = ? WHERE phone_number = ? AND selected_internship_id = ?",
      [ctx.feedback, phone, ctx.selectedInternId]
    );

    // Option 2 (optional): Save in separate feedback table
    await db.execute(
      "INSERT INTO feedback (phone_number, intern_id, message) VALUES (?, ?, ?)",
      [phone, ctx.selectedInternId, ctx.feedback]
    );

    await db.execute("DELETE FROM user_state WHERE phone_number = ?", [phone]);
    replyText = getMsg(lang, "thank_you");
  } catch (e) {
    console.error("DB error:", e);
    replyText = "⚠️ Something went wrong. Please try again later.";
  }
}


  // Fallback
  if (!replyText) replyText = getMsg(lang, "fallback") || "⚠️ Unexpected input. Please start over by typing 'hi'.";

  return replyText;
}

module.exports = { handleFlow };
