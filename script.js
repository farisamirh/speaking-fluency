let recognition;
let transcript = "";
let timeLeft = 60;

const topics = {
  "Hometown": {
    question: "Do you like your hometown?",
    hint: "Talk about its location, culture, or your favorite places."
  },
  "Study": {
    question: "What subject are you studying?",
    hint: "Mention your favorite topics, why you chose it, and any interesting aspects."
  },
  "Free Time": {
    question: "What do you usually do in your free time?",
    hint: "Talk about hobbies, sports, reading, or social activities."
  },
  "Music": {
    question: "What kind of music do you enjoy?",
    hint: "Mention genres, artists, concerts, or when you listen to music."
  },
  "Food": {
    question: "What is your favourite food?",
    hint: "Describe the taste, where you eat it, or why you like it."
  },
  "Technology": {
    question: "How often do you use your phone?",
    hint: "Talk about apps, social media, or reasons for using technology."
  },
  "Friends": {
    question: "Do you spend a lot of time with your friends?",
    hint: "Mention activities, frequency, and why it's important."
  },
  "Travel": {
    question: "Do you like travelling?",
    hint: "Talk about places you've been, dream destinations, or experiences."
  }
};

const quotes = [
  "You're improving every time you speak.",
  "Mistakes are part of fluency.",
  "Confidence matters more than perfection.",
  "IELTS rewards communication, not perfection.",
  "You're building real speaking confidence."
];

const topicSelect = document.getElementById("topicSelect");
const questionEl = document.getElementById("question");
const hintEl = document.getElementById("hint");
const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const timerEl = document.getElementById("timer");
const resultEl = document.getElementById("result");

/* Populate topic selector */
Object.keys(topics).forEach(topic => {
  const opt = document.createElement("option");
  opt.value = topic;
  opt.textContent = topic;
  topicSelect.appendChild(opt);
});

/* Smooth question + hint change */
function updateQuestion() {
  questionEl.style.opacity = 0;
  hintEl.style.opacity = 0;
  setTimeout(() => {
    const t = topics[topicSelect.value];
    questionEl.textContent = t.question;
    hintEl.textContent = `Hint: ${t.hint}`;
    questionEl.style.opacity = 1;
    hintEl.style.opacity = 1;
  }, 200);
}

topicSelect.addEventListener("change", updateQuestion);
updateQuestion();

/* Start recording */
startBtn.onclick = () => {
  startBtn.disabled = true;
  retryBtn.classList.add("hidden");
  transcript = "";
  timeLeft = 60;
  resultEl.classList.add("hidden");

  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = true;
  recognition.lang = "en-US";

  recognition.onresult = e => {
    transcript = "";
    for (let i = 0; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript + " ";
    }
  };

  recognition.start();

  const interval = setInterval(() => {
    timerEl.textContent = `⏱ ${timeLeft}s`;
    timeLeft--;

    if (timeLeft < 0) {
      clearInterval(interval);
      recognition.stop();
      analyseSpeech(transcript);
    }
  }, 1000);
};

/* Analyse transcript (less strict grammar) */
function analyseSpeech(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const fillers = text.match(/\b(um|uh|erm|like)\b/gi) || [];
  const sentences = text.split(/[.!?]/).filter(s => s.trim());

  let grammarNotes = [];
  let highlighted = "";

  sentences.forEach(s => {
    const count = s.split(/\s+/).length;
    let bad = false;

    if (count < 3 && sentences.length > 2) { grammarNotes.push("Short sentence detected."); bad = true; }
    if (count > 40) { grammarNotes.push("Very long sentence detected."); bad = true; }
    if ((s.match(/\b(and|so)\b/gi) || []).length > 6) { grammarNotes.push("Overuse of simple connectors (and / so)."); bad = true; }

    highlighted += bad ? `<span class="bad">${s}.</span> ` : `${s}. `;
  });

  const fluency = words.length < 80 || fillers.length > 12 ? "Basic" : words.length < 130 ? "Good" : "Strong";
  const grammar = grammarNotes.length > 3 ? "Needs Improvement" : "Good";

  // Rough Band Estimator (less strict)
  let band = "";
  if (fluency === "Basic" && grammar === "Needs Improvement") band = "5.5 – 6";
  if (fluency === "Basic" && grammar === "Good") band = "6 – 6.5";
  if (fluency === "Good" && grammar === "Needs Improvement") band = "6.5 – 7";
  if (fluency === "Good" && grammar === "Good") band = "7 – 7.5";
  if (fluency === "Strong" && grammar === "Needs Improvement") band = "7 – 7.5";
  if (fluency === "Strong" && grammar === "Good") band = "7.5 – 8";

  const quote = quotes[Math.floor(Math.random() * quotes.length)];

  resultEl.innerHTML = `
    <strong>Results (60 seconds)</strong><br><br>
    Words: ${words.length}<br>
    Fillers: ${fillers.length}<br><br>
    <strong>Fluency:</strong> ${fluency}<br>
    <strong>Grammar:</strong> ${grammar}<br>
    <strong>Estimated Band (Part 1):</strong> ${band}<br><br>
    <strong>Grammar Issues (if any):</strong>
    <ul>${[...new Set(grammarNotes)].map(n => `<li>${n}</li>`).join("") || "<li>No major issues detected</li>"}</ul>
    <strong>Transcript:</strong><br>${highlighted || "No speech detected."}
    <div class="quote">✨ ${quote}</div>
  `;

  resultEl.classList.remove("hidden");
  startBtn.disabled = false;
  retryBtn.classList.remove("hidden");
  timerEl.textContent = "Done";
}

/* Retry button */
retryBtn.onclick = () => {
  transcript = "";
  resultEl.classList.add("hidden");
  retryBtn.classList.add("hidden");
  timerEl.textContent = "Ready";
};
