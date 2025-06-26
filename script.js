const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const fileInput = document.getElementById('file-input');
const aadhaarInput = document.getElementById('aadhaar-input');
const uploadBtn = document.getElementById('upload-btn');
const micBtn = document.getElementById('mic-btn');

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

// --- Interview Questions ---
const voiceQuestions = [
    {
        question: "👣 How will you find 20 shops that need inventory software like IamX?\nWhere will you go? What will you do first?",
        example: "💡 Example: \"I'll go to busy markets, check shops using manual billing, and ask them about stock or billing problems. Then I'll explain the app.\""
    },
    {
        question: "🗣️ You enter a shop that uses old software or manual bills.\nWhat will be your opening line to make the owner listen?",
        example: "💡 Example: \"Sir, are you using any software? I have an app made for Indian shops to manage stock and billing — can I show you for 2 mins?\""
    },
    {
        question: "💬 Shopkeeper says: \"I already use Tally or Zoho.\"\nWhat will you say to help him understand that IamX is different?",
        example: "💡 Example: \"Sir, Tally is great for accounts, but IamX is for stock, billing, barcode, and simple shop use — very easy and faster.\""
    },
    {
        question: "📱 They ask: \"Can I use IamX on phone? Is it easy?\"\nHow will you answer?",
        example: "💡 Example: \"Yes sir, IamX works on mobile, tablet, or system. It's made for shop use and very easy to learn.\""
    },
    {
        question: "📦 A shop with 1000+ items asks: \"Can your app handle barcode, stock, sales reports?\"\nHow will you explain the key features?",
        example: "💡 Example: \"Yes sir, barcode scan, stock in-out, daily sales, and reports are all included. It's made for Indian shops with many products.\""
    },
    {
        question: "🧠 Which types of businesses do you think need IamX the most?\nGive 2–3 examples and why.",
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
];
let currentQuestionIndex = 0;

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
    addMessage('📎 Please upload your Resume in PDF format.');
    fileInput.accept = ".pdf";
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
🗣️ Speak clearly, like you're talking to a shop owner or teammate.
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
                addMessage('Great! Let\'s start with the first question.');
                askVoiceQuestion(currentQuestionIndex);
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

    if (index < voiceQuestions.length) {
        const question = voiceQuestions[index];
        showTypingIndicator();
        setTimeout(() => {
            hideTypingIndicator();
            addMessage(question.question);
            if (question.example) {
                addMessage(question.example);
            }
            micBtn.style.display = 'block';
        }, 800);
        state = 'waiting_for_voice_answer';

        interviewTimeout = setTimeout(() => {
            if (state === 'waiting_for_voice_answer') {
                addMessage('It seems you have been inactive for a while. Please type "Interview Ready" to restart the interview process.');
                state = 'waiting_for_hi';
                micBtn.style.display = 'none';
            }
        }, 300000); // 5 minutes
    } else {
        micBtn.style.display = 'none';
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
    state = 'done';
}


// --- Event Listeners ---

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (message) {
        addMessage(message, 'user');
        chatInput.value = '';

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
                userResponses.name = message;
                repromptCount = 0;
                botThankUser(message);
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
        if (uploadedFile.type !== 'application/pdf') {
            addMessage('⚠️ Invalid file type. Please upload your Resume in PDF format only.');
            fileInput.value = ''; // Reset the input to allow re-selection
            return; // Stop processing and wait for a new upload
        }
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

micBtn.addEventListener('click', async function(e) {
    e.preventDefault();
    chatInput.disabled = true; // Disable text input during recording

    if (micBtn.dataset.recording === 'true') {
        // Stop recording
        mediaRecorder.stop();
        micBtn.textContent = '🎤 Record Voice';
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

                if (state.startsWith('voice_question_')) {
                    userResponses.interviewAnswers.push(audioBlob);
                    currentQuestionIndex++;
                    askVoiceQuestion(currentQuestionIndex);
                }
            };
            mediaRecorder.start();
            micBtn.textContent = '⏹️ Stop Recording';
            micBtn.dataset.recording = 'true';
        } catch (err) {
            addMessage('Microphone access denied or not available.');
            chatInput.disabled = false;
        }
    }
});

// Initial bot message
addMessage('Say "Hi" to start the chat!'); 