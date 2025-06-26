const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const fileInput = document.getElementById('file-input');
const aadhaarInput = document.getElementById('aadhaar-input');
const uploadBtn = document.getElementById('upload-btn');
const micBtn = document.getElementById('mic-btn');
const pauseBtn = document.getElementById('pause-btn');

// --- Supabase Initialization ---
// IMPORTANT: Replace with your actual Supabase URL and Key
const SUPABASE_URL = 'https://jhnbukaukfpfqxmuintp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpobmJ1a2F1a2ZwZnF4bXVpbnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MzU1NzUsImV4cCI6MjA2NjQxMTU3NX0.tryh8bChBEiuxyvKq9VjJL7sYsn5o7d0MGdezZLIj78';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let state = 'waiting_for_hi';
let repromptCount = 0;
const maxReprompts = 3;
let interviewTimeout = null; // Timer for inactivity

// --- Data Storage ---
const userResponses = {
    name: '',
    resumeFile: null,
    whatsappNumber: '',
    languagePreference: null,
    interviewAnswers: [],
    payStructure: null,
    trainingCommitment: null,
    aadhaarConsent: null,
    aadhaarFile: null
};

// --- Localized Interview Questions ---
const localizedQuestions = {
    english: [
        {
            question: "👣 How will you find 20 shops that need inventory software like iAmX?\nWhere will you go? What will you do first?",
            example: "💡 Example: \"I'll go to busy markets, check shops using manual billing, and ask them about stock or billing problems. Then I'll explain the app.\""
        },
        {
            question: "🗣️ You enter a shop that uses old software or manual bills.\nWhat will be your opening line to make the owner listen?",
            example: "💡 Example: \"Sir, are you using any software? I have an app made for Indian shops to manage stock and billing — can I show you for 2 mins?\""
        },
        {
            question: "💬 Shopkeeper says: \"I already use Tally or Zoho.\"\nWhat will you say to help him understand that iAmX is different?",
            example: "💡 Example: \"Sir, Tally is great for accounts, but iAmX is for stock, billing, barcode, and simple shop use — very easy and faster.\""
        },
        {
            question: "📱 They ask: \"Can I use iAmX on phone? Is it easy?\"\nHow will you answer?",
            example: "💡 Example: \"Yes sir, iAmX works on mobile, tablet, or system. It's made for shop use and very easy to learn.\""
        },
        {
            question: "📦 A shop with 1000+ items asks: \"Can your app handle barcode, stock, sales reports?\"\nHow will you explain the key features?",
            example: "💡 Example: \"Yes sir, barcode scan, stock in-out, daily sales, and reports are all included. It's made for Indian shops with many products.\""
        },
        {
            question: "🧠 Which types of businesses do you think need iAmX the most?\nGive 2–3 examples and why.",
            example: "💡 Example: \"Kirana stores, mobile shops, clothing stores – because they have high stock and daily sales, and need proper control.\""
        },
        {
            question: "💰 If a customer asks about price and offers, how will you answer without sounding unsure?",
            example: "💡 Example: \"Sir, ₹1500/month with full features. If you take 1 year, you get 1 month free. No extra charges — full support included.\""
        },
        {
            question: "🎯 In your first 30 days, how many shops will you visit? How many can you close?\nGive a real, honest number.",
            example: "💡 Example: \"I'll visit 50–60 shops. I can close 15–25 easily. If I get multi-store chains, I can cross 50+ in 1–2 months.\""
        }
    ],
    telugu: [
        {
            question: "👣 iAmX వంటి ఇన్వెంటరీ సాఫ్ట్‌వేర్ అవసరమైన 20 షాపులను మీరు ఎలా కనుగొంటారు?\nమీరు ఎక్కడికి వెళతారు? మీరు మొదట ఏమి చేస్తారు?",
            example: "💡 ఉదాహరణ: \"నేను రద్దీగా ఉండే మార్కెట్‌లకు వెళ్లి, మాన్యువల్ బిల్లింగ్ ఉపయోగించే షాపులను తనిఖీ చేస్తాను మరియు వారి స్టాక్ లేదా బిల్లింగ్ సమస్యల గురించి వారిని అడుగుతాను. ఆపై నేను యాప్‌ను వివరిస్తాను.\""
        },
        {
            question: "🗣️ మీరు పాత సాఫ్ట్‌వేర్ లేదా మాన్యువల్ బిల్లులను ఉపయోగించే దుకాణంలోకి ప్రవేశించారు.\nయజమాని వినేలా చేయడానికి మీ ప్రారంభ వాక్యం ఏమిటి?",
            example: "💡 ఉదాహరణ: \"సర్, మీరు ఏదైనా సాఫ్ట్‌వేర్ ఉపయోగిస్తున్నారా? భారతీయ దుకాణాల కోసం స్టాక్ మరియు బిల్లింగ్ నిర్వహించడానికి నా దగ్గర ఒక యాప్ ఉంది - నేను మీకు 2 నిమిషాలు చూపించవచ్చా?\""
        },
        {
            question: "💬 దుకాణదారు ఇలా అంటాడు: \"నేను ఇప్పటికే టాలీ లేదా జోహోను ఉపయోగిస్తున్నాను.\"\niAmX భిన్నంగా ఉందని అతనికి అర్థమయ్యేలా మీరు ఏమి చెబుతారు?",
            example: "💡 ఉదాహరణ: \"సర్, టాలీ అకౌంట్స్ కోసం చాలా బాగుంది, కానీ iAmX స్టాక్, బిల్లింగ్, బార్‌కోడ్ మరియు సాధారణ షాప్ ఉపయోగం కోసం - చాలా సులభం మరియు వేగంగా ఉంటుంది.\""
        },
        {
            question: "📱 వారు అడుగుతారు: \"నేను ఫోన్‌లో iAmX ఉపయోగించవచ్చా? ఇది సులభమేనా?\"\nమీరు ఎలా సమాధానం ఇస్తారు?",
            example: "💡 ఉదాహరణ: \"అవును సర్, iAmX మొబైల్, టాబ్లెట్ లేదా సిస్టమ్‌లో పనిచేస్తుంది. ఇది షాప్ ఉపయోగం కోసం తయారు చేయబడింది మరియు నేర్చుకోవడం చాలా సులభం.\""
        },
        {
            question: "📦 1000+ వస్తువులు ఉన్న ఒక దుకాణం అడుగుతుంది: \"మీ యాప్ బార్‌కోడ్, స్టాక్, అమ్మకాల నివేదికలను నిర్వహించగలదా?\"\nమీరు ముఖ్య లక్షణాలను ఎలా వివరిస్తారు?",
            example: "💡 ఉదాహరణ: \"అవును సర్, బార్‌కోడ్ స్కాన్, స్టాక్ ఇన్-అవుట్, రోజువారీ అమ్మకాలు మరియు నివేదికలు అన్నీ చేర్చబడ్డాయి. ఇది చాలా ఉత్పత్తులతో భారతీయ దుకాణాల కోసం తయారు చేయబడింది.\""
        },
        {
            question: "🧠 ఏ రకమైన వ్యాపారాలకు iAmX అత్యంత అవసరమని మీరు భావిస్తున్నారు?\n2–3 ఉదాహరణలు ఇవ్వండి మరియు ఎందుకు?",
            example: "💡 ఉదాహరణ: \"కిరాణా దుకాణాలు, మొబైల్ షాపులు, బట్టల దుకాణాలు - ఎందుకంటే వాటికి అధిక స్టాక్ మరియు రోజువారీ అమ్మకాలు ఉంటాయి మరియు సరైన నియంత్రణ అవసరం.\""
        },
        {
            question: "💰 ఒక కస్టమర్ ధర మరియు ఆఫర్‌ల గురించి అడిగితే, మీరు ఖచ్చితంగా తెలియకుండా ఎలా సమాధానం ఇస్తారు?",
            example: "💡 ఉదాహరణ: \"సర్, పూర్తి ఫీచర్లతో నెలకు ₹1500. మీరు 1 సంవత్సరం తీసుకుంటే, మీకు 1 నెల ఉచితం లభిస్తుంది. అదనపు ఛార్జీలు లేవు - పూర్తి మద్దతు చేర్చబడింది.\""
        },
        {
            question: "🎯 మీ మొదటి 30 రోజులలో, మీరు ఎన్ని దుకాణాలను సందర్శిస్తారు? మీరు ఎన్ని మూసివేయగలరు?\nనిజమైన, నిజాయితీ గల సంఖ్యను ఇవ్వండి.",
            example: "💡 ఉదాహరణ: \"నేను 50-60 దుకాణాలను సందర్శిస్తాను. నేను 15-25 సులభంగా మూసివేయగలను. నాకు బహుళ-స్టోర్ చైన్‌లు లభిస్తే, నేను 1-2 నెలల్లో 50+ దాటగలను.\""
        }
    ],
    hindi: [
        {
            question: "👣 iAmX जैसे इन्वेंट्री सॉफ़्टवेयर की आवश्यकता वाली 20 दुकानें आप कैसे खोजेंगे?\nआप कहाँ जायेंगे? आप पहले क्या करेंगे?",
            example: "💡 उदाहरण: \"मैं व्यस्त बाज़ारों में जाऊँगा, मैनुअल बिलिंग का उपयोग करने वाली दुकानों की जाँच करूँगा, और उनसे उनके स्टॉक या बिलिंग समस्याओं के बारे में पूछूँगा। फिर मैं ऐप के बारे में बताऊँगा।\""
        },
        {
            question: "🗣️ आप एक ऐसी दुकान में प्रवेश करते हैं जो पुराने सॉफ्टवेयर या मैनुअल बिल का उपयोग करती है।\nमालिक को सुनने के लिए आपकी शुरुआती लाइन क्या होगी?",
            example: "💡 उदाहरण: \"सर, क्या आप कोई सॉफ्टवेयर इस्तेमाल कर रहे हैं? मेरे पास भारतीय दुकानों के लिए स्टॉक और बिलिंग प्रबंधित करने के लिए एक ऐप है - क्या मैं आपको 2 मिनट के लिए दिखा सकता हूँ?\""
        },
        {
            question: "💬 दुकानदार कहता है: \"मैं पहले से ही टैली या ज़ोहो का उपयोग करता हूँ।\"\niAmX अलग है, आप क्या कहेंगे?",
            example: "💡 उदाहरण: \"सर, टैली खातों के लिए बहुत अच्छा है, लेकिन iAmX स्टॉक, बिलिंग, बारकोड और साधारण दुकान के उपयोग के लिए है - बहुत आसान और तेज़।\""
        },
        {
            question: "📱 वे पूछते हैं: \"क्या मैं फोन पर iAmX का उपयोग कर सकता हूँ? क्या यह आसान है?\"\nआप कैसे जवाब देंगे?",
            example: "💡 उदाहरण: \"हाँ सर, iAmX मोबाइल, टैबलेट या सिस्टम पर काम करता है। यह दुकान के उपयोग के लिए बनाया गया है और सीखना बहुत आसान है।\""
        },
        {
            question: "📦 1000+ आइटम वाली एक दुकान पूछती है: \"क्या आपका ऐप बारकोड, स्टॉक, बिक्री रिपोर्ट संभाल सकता है?\"\nआप मुख्य विशेषताओं को कैसे समझाएंगे?",
            example: "💡 उदाहरण: \"हाँ सर, बारकोड स्कैन, स्टॉक इन-आउट, दैनिक बिक्री और रिपोर्ट सभी शामिल हैं। यह कई उत्पादों वाली भारतीय दुकानों के लिए बनाया गया है।\""
        },
        {
            question: "🧠 आपको क्या लगता है कि किस प्रकार के व्यवसायों को iAmX की सबसे अधिक आवश्यकता है?\n2-3 उदाहरण दें और क्यों।",
            example: "💡 उदाहरण: \"किराना स्टोर, मोबाइल की दुकानें, कपड़ों की दुकानें - क्योंकि उनके पास उच्च स्टॉक और दैनिक बिक्री होती है, और उन्हें उचित नियंत्रण की आवश्यकता होती है।\""
        },
        {
            question: "💰 यदि कोई ग्राहक कीमत और ऑफ़र के बारे में पूछता है, तो आप बिना अनिश्चित लगे कैसे जवाब देंगे?",
            example: "💡 उदाहरण: \"सर, पूरी सुविधाओं के साथ ₹1500/माह। यदि आप 1 वर्ष लेते हैं, तो आपको 1 महीना मुफ्त मिलता है। कोई अतिरिक्त शुल्क नहीं - पूर्ण समर्थन शामिल है।\""
        },
        {
            question: "🎯 अपने पहले 30 दिनों में, आप कितनी दुकानों पर जाएँगे? आप कितने बंद कर सकते हैं?\nएक वास्तविक, ईमानदार संख्या दें।",
            example: "💡 उदाहरण: \"मैं 50-60 दुकानों पर जाऊँगा। मैं 15-25 आसानी से बंद कर सकता हूँ। अगर मुझे मल्टी-स्टोर चेन मिलती हैं, तो मैं 1-2 महीने में 50+ पार कर सकता हूँ।\""
        }
    ]
};
const localizedButtonText = {
    english: {
        record: '🎤 Record Voice',
        stop: '⏹️ Stop Recording'
    },
    telugu: {
        record: '🎤 వాయిస్ రికార్డ్ చేయండి',
        stop: '⏹️ రికార్డింగ్ ఆపండి'
    },
    hindi: {
        record: '🎤 आवाज रिकॉर्ड करें',
        stop: '⏹️ रिकॉर्डिंग रोकें'
    }
};
let currentQuestionIndex = 0;

// --- State Persistence Functions ---
function saveState() {
    const stateToSave = {
        userResponses,
        currentQuestionIndex,
        state
    };
    localStorage.setItem('imxInterviewState', JSON.stringify(stateToSave));
}

function loadState() {
    const savedStateJSON = localStorage.getItem('imxInterviewState');
    if (savedStateJSON) {
        return JSON.parse(savedStateJSON);
    }
    return null;
}

function clearState() {
    localStorage.removeItem('imxInterviewState');
}

// Q9: Pay Structure Clarity
const payStructureOptions = [
    { label: '✅ Yes, I understand clearly', value: 'yes' },
    { label: '🤝 Willing to discuss', value: 'discuss' },
    { label: '❌ No, I need a fixed salary', value: 'no' }
];

// Q10: Training Commitment
const trainingOptions = [
    { label: '✅ Yes, I can come', value: 'yes' },
    { label: '📲 Remote preferred', value: 'remote' },
    { label: '🤝 Willing to discuss', value: 'discuss' }
];

// New Language Options
const languageOptions = [
    { label: '🔘 English', value: 'english' },
    { label: '🔘 हिन्दी', value: 'hindi' },
    { label: '🔘 తెలుగు', value: 'telugu' }
];

// --- Media Recorder ---
let mediaRecorder = null;
let audioChunks = [];

const aadhaarConsentOptions = [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' }
];

const localizedMessages = {
    english: {
        resume: 'Resuming your interview...',
        paused: '⏸️ Your interview is paused. When you return, please choose an option to continue.',
        welcome: 'Welcome back! It looks like you have a paused interview.',
        noSaved: 'No saved session found. Say "Hi" to start a new one.',
        noProblem: 'No problem. Say "Hi" to start a new interview!',
        btnResume: '✅ Yes, Resume',
        btnStartOver: '❌ No, Start Over',
        btnPause: '⏸️ Pause Interview',
        startFirst: "Great! Let's start with the first question.",
        resumeWord: 'Resume',
        voiceOnly: '🎤 REPLY VIA VOICE MESSAGE ONLY',
        invalidName: 'Please enter a valid name using only letters and spaces.'
    },
    telugu: {
        resume: 'మీ ఇంటర్వ్యూను తిరిగి ప్రారంభిస్తున్నాము...',
        paused: '⏸️ మీ ఇంటర్వ్యూ నిలిపివేయబడింది. తిరిగి వచ్చినప్పుడు, కొనసాగించడానికి ఒక ఎంపికను ఎంచుకోండి.',
        welcome: 'మళ్లీ స్వాగతం! మీరు ఒక నిలిపివేసిన ఇంటర్వ్యూను కొనసాగించవచ్చు.',
        noSaved: 'ఏదైనా సేవ్ చేసిన సెషన్ కనబడలేదు. కొత్తదాన్ని ప్రారంభించడానికి "Hi" అని చెప్పండి.',
        noProblem: 'పరిస్థితి లేదు. కొత్త ఇంటర్వ్యూను ప్రారంభించడానికి "Hi" అని చెప్పండి!',
        btnResume: '✅ అవును, కొనసాగించండి',
        btnStartOver: '❌ లేదు, కొత్తదాన్ని ప్రారంభించండి',
        btnPause: '⏸️ ఇంటర్వ్యూను నిలిపివేయండి',
        startFirst: 'అద్భుతం! మొదటి ప్రశ్నను ప్రారంభిద్దాం.',
        resumeWord: 'పునఃప్రారంభించండి',
        voiceOnly: '🎤 దయచేసి వాయిస్ మెసేజ్ ద్వారా మాత్రమే సమాధానం ఇవ్వండి',
        invalidName: 'దయచేసి అక్షరాలు మరియు ఖాళీలను మాత్రమే ఉపయోగించి చెల్లుబాటు అయ్యే పేరును నమోదు చేయండి.'
    },
    hindi: {
        resume: 'आपका इंटरव्यू फिर से शुरू हो रहा है...',
        paused: '⏸️ आपका इंटरव्यू रुका हुआ है। जब आप वापस आएं, जारी रखने के लिए एक विकल्प चुनें।',
        welcome: 'वापसी पर स्वागत है! ऐसा लगता है कि आपके पास एक रुका हुआ इंटरव्यू है।',
        noSaved: 'कोई सहेजा गया सत्र नहीं मिला। नया शुरू करने के लिए "Hi" टाइप करें।',
        noProblem: 'कोई बात नहीं। नया इंटरव्यू शुरू करने के लिए "Hi" टाइप करें!',
        btnResume: '✅ हाँ, फिर से शुरू करें',
        btnStartOver: '❌ नहीं, नया शुरू करें',
        btnPause: '⏸️ इंटरव्यू रोकें',
        startFirst: 'बहुत बढ़िया! चलिए पहले सवाल से शुरू करते हैं।',
        resumeWord: 'फिर से शुरू करें',
        voiceOnly: '🎤 कृपया केवल वॉयस मैसेज के माध्यम से उत्तर दें',
        invalidName: 'कृपया केवल अक्षरों और रिक्त स्थान का उपयोग करके एक वैध नाम दर्ज करें।'
    }
};

function getLang() {
    return userResponses.languagePreference || 'english';
}

function addMessage(text, sender = 'bot') {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.innerHTML = text.replace(/\n/g, '<br>'); // Support line breaks
    chatWindow.appendChild(bubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function addFileMessage(file, sender = 'user') {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.style.maxWidth = '180px';
        img.style.display = 'block';
        bubble.appendChild(img);
    } else if (file.type === 'application/pdf') {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file);
        link.textContent = 'View PDF';
        link.target = '_blank';
        bubble.appendChild(link);
    } else {
        bubble.textContent = 'File uploaded';
    }
    chatWindow.appendChild(bubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function addAudioMessage(audioBlob, sender = 'user') {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = URL.createObjectURL(audioBlob);
    bubble.appendChild(audio);
    chatWindow.appendChild(bubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'chat-bubble bot typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    chatWindow.appendChild(indicator);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = chatWindow.querySelector('.typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// --- Bot Functions ---

function botAskFullName() {
    addMessage('What is your full name?');
    state = 'waiting_for_name';
}

function botThankUser(name) {
    addMessage(`Thank you, ${name}!`);
    showTypingIndicator();
    setTimeout(() => {
        hideTypingIndicator();
        botAskResume();
    }, 600);
}

function botRepromptFullName() {
    addMessage('Please tell me your full name.');
    repromptCount++;
    if (repromptCount >= maxReprompts) {
        addMessage('We could not get your name. Please refresh to try again.');
        state = 'done';
    }
}

function botAskResume() {
    addMessage('Please upload your latest resume.');
    fileInput.accept = ""; // Allow all file types
    uploadBtn.style.display = 'block';
    state = 'waiting_for_resume_upload';
}

function botAskWhatsapp() {
    addMessage('📲 Please enter your WhatsApp number for future communication.');
    state = 'waiting_for_whatsapp';
}

function botAskIfReadyForInterview() {
    clearTimeout(interviewTimeout);

    addMessage(`✅ Thank you. Now we'll begin your voice interview round.
🕒 It takes around 15–20 minutes.
🎙️ Please send voice message answers only – typed answers will not be accepted.
🎧 Make sure you're in a quiet place or wear earphones so your answers are clear.

To begin your interview, please select your preferred reply language:`);
    
    showOptions(languageOptions, 'language_preference_and_start');

    addMessage(`❌ If you're not ready now, simply reply "Interview Ready" whenever you want to begin later.`);

    state = 'waiting_for_language_selection_to_start';

    interviewTimeout = setTimeout(() => {
        if (state === 'waiting_for_language_selection_to_start') {
            addMessage('It seems you have been inactive for a while. Please type "Interview Ready" when you are set to begin.');
            state = 'waiting_for_hi';
        }
    }, 300000); // 5 minutes = 300,000 ms
}

function askPayStructure() {
    setTimeout(() => {
        addMessage('💼 This is an incentive-only role (no fixed pay) for the first 3–6 months.<br>📌 You will earn:<br>– 15% flat commission per sale (unlimited)<br>– Bonus if you perform well<br>– Full-time fixed pay onboarding only after review<br><br>💡 Example: You close 20 stores → ₹1,650 × 20 = ₹33,000/month.<br>If you target chain outlets or referrals, even higher is possible.<br><br>✅ Do you fully understand this pay system?<br>Please choose one:<br>✅ Yes, I understand clearly<br>🤝 Willing to discuss<br>❌ No, I need a fixed salary<br>👉 REPLY WITH ONE OPTION ONLY');
        showOptions(payStructureOptions, 'pay_structure');
    }, 600);
}

function askTrainingCommitment() {
    setTimeout(() => {
        addMessage('🧠 We give 2 weeks of training before you start.<br>📍 It will be 3–4 hours/day in Banjara Hills, Road No. 12.<br>This is to help you feel confident client during demos and understand what you are selling.<br><br>✅ Are you willing to attend this training?<br>Please choose one:<br>✅ Yes, I can come<br>📲 Remote preferred<br>🤝 Willing to discuss<br>👉 REPLY WITH ONE OPTION ONLY');
        showOptions(trainingOptions, 'training_commitment');
    }, 600);
}

function askAadhaarConsent() {
    addMessage('If you understood the entire role specifications, please upload the Aadhaar.');
    showOptions(aadhaarConsentOptions, 'aadhaar_consent');
}

function botAskAadhaar() {
    addMessage('📎 Please upload your Aadhaar as a PDF or Image file.');
    fileInput.accept = ".pdf,.jpg,.jpeg,.png";
    uploadBtn.style.display = 'block';
    state = 'waiting_for_aadhaar_upload';
}

function showOptions(options, stateKey) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble bot';
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '10px';

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt.label;
        btn.className = 'option-btn';
        btn.onclick = () => {
            addMessage(opt.label, 'user');
            bubble.remove();
            if (stateKey === 'pay_structure') {
                userResponses.payStructure = opt.value;
                if (opt.value === 'no') {
                    addMessage('Thank you for your honesty. This role might not be the right fit, as it is incentive-only for the first few months.');
                    botEndInterview();
                } else {
                    askTrainingCommitment();
                }
            } else if (stateKey === 'training_commitment') {
                userResponses.trainingCommitment = opt.value;
                askAadhaarConsent();
            } else if (stateKey === 'aadhaar_consent') {
                userResponses.aadhaarConsent = opt.value;
                if (opt.value === 'yes') {
                    botAskAadhaar();
                } else {
                    botEndInterview();
                }
            } else if (stateKey === 'language_preference_and_start') {
                clearTimeout(interviewTimeout);
                userResponses.languagePreference = opt.value;
                addMessage(localizedMessages[userResponses.languagePreference].startFirst);
                askVoiceQuestion(currentQuestionIndex);
            } else if (stateKey === 'resume_confirmation') {
                if (opt.value === 'resume') {
                    resumeInterview();
                } else { // Start Over
                    clearState();
                    addMessage(localizedMessages[getLang()].noProblem);
                    state = 'waiting_for_hi';
                }
            }
        };
        buttonContainer.appendChild(btn);
    });
    bubble.appendChild(buttonContainer);
    chatWindow.appendChild(bubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    if (stateKey === 'pay_structure') {
        state = 'waiting_for_pay_structure';
    } else if (stateKey === 'training_commitment') {
        state = 'waiting_for_training_commitment';
    } else if (stateKey === 'language_preference_and_start') {
        state = 'waiting_for_language_selection_to_start';
    }
}

function askVoiceQuestion(index) {
    clearTimeout(interviewTimeout); 

    const language = userResponses.languagePreference || 'english';
    const questions = localizedQuestions[language];
    const buttonText = localizedButtonText[language];

    if (index < questions.length) {
        const question = questions[index];
        showTypingIndicator();
        setTimeout(() => {
            hideTypingIndicator();
            let fullMessage = `${localizedMessages[language].voiceOnly}<br><br>${question.question}`;
            if (question.example) {
                fullMessage += `<br><br>${question.example}`;
            }
            addMessage(fullMessage);
            micBtn.textContent = buttonText.record;
            micBtn.style.display = 'block';
            pauseBtn.textContent = localizedMessages[language].btnPause;
            pauseBtn.style.display = 'block';
        }, 800);
        state = 'waiting_for_voice_answer';

        interviewTimeout = setTimeout(() => {
            if (state === 'waiting_for_voice_answer') {
                addMessage('It seems you have been inactive for a while. Please type "Interview Ready" to restart the interview process.');
                state = 'waiting_for_hi';
                micBtn.style.display = 'none';
                pauseBtn.style.display = 'none';
            }
        }, 300000); // 5 minutes
    } else {
        micBtn.style.display = 'none';
        pauseBtn.style.display = 'none';
        askPayStructure();
    }
}

function addBotAudioMessage(audioSrc) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble bot';
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = audioSrc;
    audio.autoplay = true;
    bubble.appendChild(audio);
    chatWindow.appendChild(bubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function submitData() {
    const safeName = userResponses.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const submissionId = `${safeName}_${Date.now()}`;

    // --- Upload Files ---
    const uploadFile = async (file, path) => {
        if (!file) return null;
        const { data, error } = await supabaseClient.storage
            .from('user-uploads')
            .upload(path, file);
        if (error) {
            console.error('Upload Error:', error.message);
            return null;
        }
        return data.path;
    };

    let resumePath = null;
    if (userResponses.resumeFile) {
        resumePath = await uploadFile(userResponses.resumeFile, `${submissionId}/resume-${userResponses.resumeFile.name}`);
    }

    let aadhaarPath = null;
    if (userResponses.aadhaarFile) {
        aadhaarPath = await uploadFile(userResponses.aadhaarFile, `${submissionId}/aadhaar-${userResponses.aadhaarFile.name}`);
    }

    let languagePath = null;
    if (userResponses.languageAudio) {
        languagePath = await uploadFile(userResponses.languageAudio, `${submissionId}/language-preference.webm`);
    }

    const interviewAnswerPaths = [];
    for (let i = 0; i < userResponses.interviewAnswers.length; i++) {
        const path = await uploadFile(userResponses.interviewAnswers[i], `${submissionId}/interview-answer-${i + 1}.webm`);
        if (path) interviewAnswerPaths.push(path);
    }

    // --- Store Data in Database ---
    const { data, error } = await supabaseClient
        .from('submissions')
        .insert([{
            full_name: userResponses.name,
            whatsapp_number: userResponses.whatsappNumber,
            resume_file_path: resumePath,
            aadhaar_file_path: aadhaarPath,
            language_audio_path: languagePath,
            pay_structure: userResponses.payStructure,
            training_commitment: userResponses.trainingCommitment,
            aadhaar_consent: userResponses.aadhaarConsent,
            interview_answers: interviewAnswerPaths
        }]);

    if (error) {
        console.error('Database Error:', error);
        addMessage("⚠️ An error occurred while saving. Please try again later.");
    } else {
        addBotAudioMessage('final-thankyou.mp3');
    }
}

function botEndInterview() {
    submitData();
    clearState();
    state = 'done';
}

function resumeInterview() {
    const saved = loadState();
    if (saved) {
        Object.assign(userResponses, saved.userResponses);
        currentQuestionIndex = saved.currentQuestionIndex;
        state = saved.state;
        addMessage(localizedMessages[getLang()].resume);
        if (state === 'waiting_for_voice_answer') {
            askVoiceQuestion(currentQuestionIndex);
        } else if (state === 'waiting_for_pay_structure') {
            askPayStructure();
        } else if (state === 'waiting_for_training_commitment') {
            askTrainingCommitment();
        } else if (state === 'waiting_for_aadhaar_consent') {
            askAadhaarConsent();
        }
    } else {
        addMessage(localizedMessages[getLang()].noSaved);
        state = 'waiting_for_hi';
    }
}

// --- Event Listeners ---

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (message) {
        addMessage(message, 'user');
        chatInput.value = '';

        if (message.toLowerCase() === 'resume') {
            resumeInterview();
            return;
        }
        
        if (message.toLowerCase() === 'interview ready') {
            state = 'waiting_for_interview_ready_confirmation';
        }

        switch (state) {
            case 'waiting_for_hi':
                if (message.toLowerCase().includes('hi') || message.toLowerCase().includes('hello') || message.toLowerCase() === 'interview ready') {
                    repromptCount = 0;
                    botAskFullName();
                } else {
                    botRepromptFullName();
                }
                break;
            case 'waiting_for_name':
                if (/^[a-zA-Z\s]+$/.test(message)) {
                    userResponses.name = message;
                    repromptCount = 0;
                    botThankUser(message);
                } else {
                    addMessage(localizedMessages[getLang()].invalidName);
                }
                break;
            case 'waiting_for_whatsapp':
                 if (/\d{10}/.test(message.replace(/\D/g, ''))) {
                    userResponses.whatsappNumber = message;
                    repromptCount = 0;
                    botAskIfReadyForInterview();
                } else {
                    addMessage('Please enter a valid 10-digit WhatsApp number.');
                }
                break;
             case 'waiting_for_interview_ready_confirmation':
                repromptCount = 0;
                botAskIfReadyForInterview();
                break;
            case 'paused':
                if (message.toLowerCase() !== 'resume') {
                    addMessage('Your interview is currently paused. Please type "Resume" to continue.');
                }
                break;
            case 'waiting_for_language_selection_to_start':
            case 'waiting_for_voice_answer':
            case 'waiting_for_pay_structure':
            case 'waiting_for_training_commitment':
            case 'waiting_for_aadhaar_consent':
                 addMessage('Please use the buttons or the voice recorder to reply.');
                 break;

        }
    }
});

uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', function() {
    if (!fileInput.files || fileInput.files.length === 0) {
        return; // No file selected
    }

    const uploadedFile = fileInput.files[0];

    // --- Validation for Resume ---
    if (state === 'waiting_for_resume_upload') {
        // If valid, proceed
        userResponses.resumeFile = uploadedFile;
        addFileMessage(uploadedFile, 'user');
        uploadBtn.style.display = 'none';
        showTypingIndicator();
        setTimeout(() => {
            hideTypingIndicator();
            botAskWhatsapp();
        }, 600);
    }
    // --- Validation for Aadhaar ---
    else if (state === 'waiting_for_aadhaar_upload') {
        const isValidAadhaar = uploadedFile.type === 'application/pdf' || uploadedFile.type.startsWith('image/');
        if (!isValidAadhaar) {
            addMessage('⚠️ Invalid file type. Please upload your Aadhaar as a PDF or an Image file.');
            fileInput.value = ''; // Reset the input
            return; // Stop processing and wait for a new upload
        }
        // If valid, proceed
        userResponses.aadhaarFile = uploadedFile;
        addFileMessage(uploadedFile, 'user');
        uploadBtn.style.display = 'none';
        botEndInterview();
    }
});

pauseBtn.addEventListener('click', () => {
    saveState();
    const lang = getLang();
    const pausedMsg = localizedMessages[lang].paused.replace('{resumeWord}', localizedMessages[lang].resumeWord);
    addMessage(pausedMsg);
    micBtn.style.display = 'none';
    pauseBtn.style.display = 'none';
    clearTimeout(interviewTimeout); // Stop the inactivity timer
    state = 'paused';
});

micBtn.addEventListener('click', async function(e) {
    e.preventDefault();
    chatInput.disabled = true; // Disable text input during recording

    const language = userResponses.languagePreference || 'english';
    const buttonText = localizedButtonText[language];

    if (micBtn.dataset.recording === 'true') {
        // Stop recording
        mediaRecorder.stop();
        micBtn.textContent = buttonText.record;
        micBtn.dataset.recording = '';
        micBtn.disabled = true;
    } else {
        // Start recording
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                addAudioMessage(audioBlob, 'user');
                micBtn.style.display = 'none';
                micBtn.disabled = false;
                chatInput.disabled = false; // Re-enable text input

                if (state === 'waiting_for_voice_answer') {
                    userResponses.interviewAnswers.push(audioBlob);
                    currentQuestionIndex++;
                    askVoiceQuestion(currentQuestionIndex);
                }
            };
            mediaRecorder.start();
            micBtn.textContent = buttonText.stop;
            micBtn.dataset.recording = 'true';
        } catch (err) {
            addMessage('Microphone access denied or not available.');
            chatInput.disabled = false;
        }
    }
});

function initializeChat() {
    const savedState = loadState();
    const lang = savedState && savedState.userResponses && savedState.userResponses.languagePreference ? savedState.userResponses.languagePreference : 'english';
    if (savedState && savedState.state !== 'done') { 
        addMessage(localizedMessages[lang].welcome);
        showOptions([
            { label: localizedMessages[lang].btnResume, value: 'resume' },
            { label: localizedMessages[lang].btnStartOver, value: 'start_over' }
        ], 'resume_confirmation');
        state = 'waiting_for_resume_confirmation';
    } else {
        addMessage('Say "Hi" to start the chat!');
        state = 'waiting_for_hi';
    }
}

// Initial bot message
initializeChat(); 