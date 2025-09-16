const messages = {
  en: {
    hello: "👋 Hello!",
    welcome: "Welcome to the Internship Program!",
    lang_options: "🌐 Choose language / மொழியை தேர்வு செய்யவும் / भाषा चुनें:\n1. Tamil\n2. Hindi\n3. English",
    ask_name: "🧑 What's your name? (e.g., John Doe)",
    ask_age: "📅 What's your age? (21-24 only, e.g., 22)",
    age_invalid: "❌ Sorry, only ages 21 to 24 are allowed.",
    ask_income: "💰 What's your annual income? (Max ₹8,00,000, e.g., 500000)",
    income_invalid: "❌ Sorry, income above ₹8,00,000 is not eligible.",
    ask_job: "💼 What is your current job/internship status? (e.g., Student, Working at XYZ Corp, Intern at ABC)",
    ask_govt_intern: "🏛️ Have you attended any government internship before? (yes/no, e.g., no)",
    govt_intern_not_eligible: "❌ Sorry, you're not eligible for this program.",
    ask_qualification: "🎓 Enter your current qualification (e.g., B.Tech CSE, M.Sc Physics)",
    ask_skill: "💡 Mention your technical skills (e.g., React, Python, C++)",
    ask_location: "📍 Enter your preferred location (e.g., Bangalore, Hyderabad)",
    eligible: "🎉 You are eligible for the internship program!",
    match_menu: "👇 Reply:\n1 - Show more internships\n2 - Choose one",
    invalid_choice: "❌ Invalid choice, please reply correctly.",
    select_intern: "Which one do you want details for? (1/2/3)",
    feedback: "📝 Please provide your feedback for the internship (e.g., Very informative, Good experience, Loved it!)",
    thank_you: "🙏 Thank you for your feedback!",
    fallback: "⚠️ Unexpected input. Please start over by typing 'hi'."
  },
  ta: {
    hello: "👋 வணக்கம்!",
    welcome: "இண்டர்ன்ஷிப் திட்டத்திற்கு வரவேற்கின்றோம்!",
    lang_options: "🌐 மொழியை தேர்வு செய்யவும்:\n1. தமிழ்\n2. ஹிந்தி\n3. ஆங்கிலம்",
    ask_name: "உங்கள் பெயர் என்ன? (எ.கா: ஜான் டோ)",
    ask_age: "உங்கள் வயது என்ன? (21-24 மட்டும், எ.கா: 22)",
    age_invalid: "❌ மன்னிக்கவும், 21 முதல் 24 வயதுக்குள் மட்டுமே அனுமதிக்கப்படும்.",
    ask_income: "💰 உங்கள் ஆண்டு வருமானம் என்ன? (குறைந்தது ₹8,00,000, எ.கா: 500000)",
    income_invalid: "❌ மன்னிக்கவும், ₹8,00,000க்கு மேல் வருமானம் தகுதியில்லை.",
    ask_job: "தற்போதைய வேலை/இணைப்பு நிலை என்ன? (எ.கா: Student, XYZ நிறுவனத்தில் வேலை, ABC இல் Intern)",
    ask_govt_intern: "நீங்கள் அரசு இண்டர்ன்ஷிப் ஒன்றில் கலந்து கொண்டீர்களா? (ஆம்/இல்லை, எ.கா: இல்லை)",
    govt_intern_not_eligible: "❌ மன்னிக்கவும், நீங்கள் தகுதியில்லை.",
    ask_qualification: "தற்போதைய தகுதியை உள்ளிடவும் (எ.கா: B.Tech CSE, M.Sc Physics)",
    ask_skill: "உங்கள் தொழில்நுட்ப திறன்களை குறிப்பிடவும் (எ.கா: React, Python, C++)",
    ask_location: "விருப்பமான இடத்தை உள்ளிடவும் (எ.கா: Bangalore, Hyderabad)",
    eligible: "🎉 நீங்கள் இண்டர்ன்ஷிப் திட்டத்திற்கு தகுதி வாய்ந்தவர்!",
    match_menu: "👇 பதிலளிக்க:\n1 - மேலும் இடங்களை காண்பி\n2 - ஒன்றைத் தேர்வுசெய்",
    invalid_choice: "❌ தவறான தேர்வு, சரியாக பதிலளிக்கவும்.",
    select_intern: "நீங்கள் எந்த ஒன்றை விரும்புகிறீர்கள்? (1/2/3)",
    feedback: "📝 இண்டர்ன்ஷிப் தொடர்பான உங்கள் கருத்தை பதிவு செய்யவும் (எ.கா: மிகவும் பயனுள்ளதாக இருந்தது, நல்ல அனுபவம், மிகவும் பிடித்தது!)",
    thank_you: "🙏 உங்கள் கருத்துக்கு நன்றி!",
    fallback: "⚠️ தவறான உள்ளீடு. 'hi' என தட்டச்சு செய்து மீண்டும் தொடங்கவும்."
  },
  hi: {
    hello: "👋 नमस्ते!",
    welcome: "इंटर्नशिप प्रोग्राम में आपका स्वागत है!",
    lang_options: "🌐 भाषा चुनें:\n1. तमिल\n2. हिंदी\n3. अंग्रेज़ी",
    ask_name: "आपका नाम क्या है? (उदा: John Doe)",
    ask_age: "आपकी उम्र क्या है? (केवल 21-24 वर्ष, उदा: 22)",
    age_invalid: "❌ क्षमा करें, केवल 21 से 24 वर्ष के उम्मीदवार मान्य हैं।",
    ask_income: "💰 आपकी वार्षिक आय क्या है? (अधिकतम ₹8,00,000, उदा: 500000)",
    income_invalid: "❌ क्षमा करें, ₹8,00,000 से अधिक आय वाले पात्र नहीं हैं।",
    ask_job: "आपकी वर्तमान नौकरी/इंटर्नशिप स्थिति क्या है? (उदा: Student, XYZ कंपनी में काम, ABC में Intern)",
    ask_govt_intern: "क्या आपने पहले कोई सरकारी इंटर्नशिप की है? (हाँ/नहीं, उदा: नहीं)",
    govt_intern_not_eligible: "❌ क्षमा करें, आप पात्र नहीं हैं।",
    ask_qualification: "अपनी वर्तमान योग्यता दर्ज करें (उदा: B.Tech CSE, M.Sc Physics)",
    ask_skill: "अपने तकनीकी कौशल दर्ज करें (उदा: React, Python, C++)",
    ask_location: "अपना पसंदीदा स्थान दर्ज करें (उदा: Bangalore, Hyderabad)",
    eligible: "🎉 आप इस इंटर्नशिप के लिए पात्र हैं!",
    match_menu: "👇 उत्तर दें:\n1 - और विकल्प दिखाएं\n2 - किसी एक को चुनें",
    invalid_choice: "❌ अमान्य विकल्प, कृपया सही जवाब दें।",
    select_intern: "आप किसे चुनना चाहते हैं? (1/2/3)",
    feedback: "📝 कृपया इंटर्नशिप के लिए अपनी प्रतिक्रिया दें (उदा: बहुत जानकारीपूर्ण, अच्छा अनुभव, बहुत पसंद आया!)",
    thank_you: "🙏 आपकी प्रतिक्रिया के लिए धन्यवाद!",
    fallback: "⚠️ अप्रत्याशित इनपुट। कृपया 'hi' टाइप करके फिर से शुरू करें।"
  }
};

function getMsg(lang, key) {
  return messages[lang]?.[key] || messages["en"][key] || "⚠️ Unknown message.";
}

module.exports = getMsg;
