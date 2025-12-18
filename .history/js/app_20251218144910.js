// =====================
// IMAGES & QUESTIONS
// =====================
const QUESTIONS = [
  { img: "./assets/images/apple.png", answer: "Apple", choices: ["Apple", "Banana", "Orange", "Grapes"] },
  { img: "./assets/images/dog.webp", answer: "Dog", choices: ["Cat", "Dog", "Bird", "Fish"] },
  { img: "./assets/images/car.webp", answer: "Car", choices: ["Bike", "Bus", "Car", "Train"] },
  { img: "./assets/images/book.png", answer: "Book", choices: ["Pen", "Book", "Chair", "Phone"] },
  { img: "./assets/images/house.webp", answer: "House", choices: ["House", "School", "Hospital", "Store"] },

  { img: "./assets/images/cat.webp", answer: "Cat", choices: ["Dog", "Cat", "Bird", "Fish"] },
  { img: "./assets/images/bus.webp", answer: "Bus", choices: ["Car", "Bike", "Bus", "Train"] },
  { img: "./assets/images/bike.webp", answer: "Bike", choices: ["Bike", "Bus", "Car", "Plane"] },
  { img: "./assets/images/train.webp", answer: "Train", choices: ["Train", "Boat", "Bus", "Car"] },
  { img: "./assets/images/pen.webp", answer: "Pen", choices: ["Pencil", "Pen", "Book", "Eraser"] },

  { img: "./assets/images/chair.webp", answer: "Chair", choices: ["Table", "Chair", "Sofa", "Bed"] },
  { img: "./assets/images/phone.webp", answer: "Phone", choices: ["Laptop", "Phone", "Tablet", "Camera"] },
  { img: "./assets/images/laptop.webp", answer: "Laptop", choices: ["Keyboard", "Laptop", "Mouse", "Monitor"] },
  { img: "./assets/images/water.webp", answer: "Water", choices: ["Milk", "Juice", "Water", "Tea"] },
  { img: "./assets/images/milk.webp", answer: "Milk", choices: ["Coffee", "Milk", "Tea", "Water"] },

  { img: "./assets/images/coffee.webp", answer: "Coffee", choices: ["Coffee", "Tea", "Milk", "Soda"] },
  { img: "./assets/images/tea.webp", answer: "Tea", choices: ["Tea", "Coffee", "Water", "Juice"] },
  { img: "./assets/images/bread.webp", answer: "Bread", choices: ["Cheese", "Bread", "Cake", "Pizza"] },
  { img: "./assets/images/cake.webp", answer: "Cake", choices: ["Cake", "Bread", "Cookie", "Pie"] },
  { img: "./assets/images/pizza.webp", answer: "Pizza", choices: ["Burger", "Pizza", "Taco", "Salad"] },

  { img: "./assets/images/sun.webp", answer: "Sun", choices: ["Moon", "Star", "Sun", "Cloud"] },
  { img: "./assets/images/moon.webp", answer: "Moon", choices: ["Moon", "Sun", "Cloud", "Rain"] },
  { img: "./assets/images/cloud.webp", answer: "Cloud", choices: ["Cloud", "Sun", "Snow", "Wind"] },
  { img: "./assets/images/rain.webp", answer: "Rain", choices: ["Rain", "Snow", "Sun", "Fog"] },
  { img: "./assets/images/snow.webp", answer: "Snow", choices: ["Snow", "Rain", "Sun", "Cloud"] },
];


// =====================
// SOUNDS
// =====================
const sounds = {
  click: new Audio("./assets/audio/click.mp3"),
  ok: new Audio("./assets/audio/correct.mp3"),
  bad: new Audio("./assets/audio/wrong.mp3"),
  finish: new Audio("./assets/audio/finish.mp3"),
};
function safePlay(audio) {
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

// =====================
// STATE (global variables)
// =====================
let currentIndex = 0;
let score = 0;
let hits = 0;
let fails = 0;
let bestStreak = 0;
let streak = 0;

let timePerQuestion = 10; // default
let timeLeft = timePerQuestion;
let timerId = null;

let locked = false; // bloquea clicks después de responder
let historyRows = []; // para tabla final

// =====================
// DOM
// =====================
const vStart = document.getElementById("v-start");
const vGame = document.getElementById("v-game");
const vScore = document.getElementById("v-score");

const playerInput = document.getElementById("player");
const modeSelect = document.getElementById("mode");
const difficultySelect = document.getElementById("difficulty");

const imgEl = document.getElementById("card-image");
const optionButtons = Array.from(document.querySelectorAll(".option-button"));
const nextBtn = document.getElementById("next-button");

const feedbackEl = document.getElementById("feedback");
const timerTextEl = document.getElementById("timer-text");

const roundTextEl = document.getElementById("round-text");
const hitsTextEl = document.getElementById("hits-text");
const failsTextEl = document.getElementById("fails-text");

// Score view
const scorePointsEl = document.getElementById("score-points");
const scoreAccuracyEl = document.getElementById("score-accuracy");
const scoreStreakEl = document.getElementById("score-streak");
const finalMessageEl = document.getElementById("final-message");
const scoreRowsEl = document.getElementById("score-rows");

// Botón iniciar (es un label). Lo detectamos por clase y texto.
// (Si querés, poné id="start-btn" al label "Iniciar" y lo tomamos directo)
const startLabels = Array.from(document.querySelectorAll("label.btn-next"));
const startBtn = startLabels.find((l) => l.textContent.trim().toLowerCase() === "start"); 

// =====================
// HELPERS
// =====================
function formatTime(sec) {
  const s = Math.max(0, sec);
  return `00:${String(s).padStart(2, "0")}`;
}

function getTotalQuestions() {
  const mode = modeSelect.value.toLowerCase();
  if (mode.includes("5")) return Math.min(5, QUESTIONS.length);
  if (mode.includes("10")) return Math.min(10, QUESTIONS.length);
  return QUESTIONS.length; // All Cards
}


function applyDifficulty() {
  const diff = difficultySelect.value.toLowerCase();
  if (diff.includes("easy") || diff.includes("fácil")) timePerQuestion = 12;    
  else if (diff.includes("medium") || diff.includes("media")) timePerQuestion = 10; 
  else timePerQuestion = 7;
}

// =====================
// TIMER (loop con setInterval)
// =====================
function startTimer() {
  stopTimer();
  timeLeft = timePerQuestion;
  timerTextEl.textContent = formatTime(timeLeft);

  timerId = setInterval(() => {
    timeLeft -= 1;
    timerTextEl.textContent = formatTime(timeLeft);

    if (timeLeft <= 0) {
      stopTimer();
      // tiempo agotado = incorrecto automático
      handleAnswer(null, true);
    }
  }, 1000);
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

// =====================
// GAME FLOW
// =====================
function resetGame() {
  currentIndex = 0;
  score = 0;
  hits = 0;
  fails = 0;
  bestStreak = 0;
  streak = 0;
  historyRows = [];
  locked = false;
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
}
function loadQuestion() {
  const total = getTotalQuestions();

  if (currentIndex >= total) {
    endGame();
    return;
  }

  locked = false;
  nextBtn.disabled = true;

  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";

  // Disable options until the image is ready
  optionButtons.forEach((b) => {
    b.disabled = true;
    b.classList.remove("correct", "wrong");
  });

  const q = QUESTIONS[currentIndex];

  // Safety guard (prevents undefined crashes)
  if (!q) {
    endGame();
    return;
  }

  // Reset handlers to avoid stale events
  imgEl.onload = null;
  imgEl.onerror = null;

  imgEl.onload = () => {
    optionButtons.forEach((b) => (b.disabled = false));
    startTimer();
  };

  imgEl.onerror = () => {
    feedbackEl.textContent = "⚠️ Image could not be loaded. Click Next.";
    feedbackEl.className = "feedback bad";
    nextBtn.disabled = false;
  };

  imgEl.src = q.img;

  optionButtons.forEach((btn, i) => {
    btn.textContent = q.choices[i] ?? `Option ${i + 1}`;
    btn.dataset.choice = btn.textContent;
  });

  roundTextEl.textContent = `${currentIndex + 1}/${total}`;
  hitsTextEl.textContent = String(hits);
  failsTextEl.textContent = String(fails);
}

function handleAnswer(selectedText, timedOut = false) {
  if (locked) return;
  locked = true;
  stopTimer();

  const q = QUESTIONS[currentIndex];
  const correct = selectedText === q.answer;

  // deshabilito botones
  optionButtons.forEach((b) => (b.disabled = true));

  // feedback inmediato
  if (timedOut) {
    feedbackEl.textContent = "⏰ Time's up!";
    feedbackEl.className = "feedback bad";
    fails += 1;
    streak = 0;
    safePlay(sounds.bad);
  } else if (correct) {
    feedbackEl.textContent = "✅ Correct!";
    feedbackEl.className = "feedback ok";
    hits += 1;
    streak += 1;
    bestStreak = Math.max(bestStreak, streak);
    score += 25; // puntos por acierto
    safePlay(sounds.ok);
  } else {
    feedbackEl.textContent = `❌ Wrong! Correct: ${q.answer}`;
    feedbackEl.className = "feedback bad";
    fails += 1;
    streak = 0;
    safePlay(sounds.bad);
  }

  // marco colores en botones (DOM manipulation)
  optionButtons.forEach((btn) => {
    if (btn.dataset.choice === q.answer) btn.classList.add("correct");
    if (!correct && btn.dataset.choice === selectedText) btn.classList.add("wrong");
  });

  // guardo fila para score table
  historyRows.push({
    round: currentIndex + 1,
    answer: timedOut ? "(No answer)" : (selectedText ?? "(No answer)"),
    result: correct ? "Correct" : "Wrong",
    time: formatTime(timeLeft),
    points: correct ? "+25" : "+0",
  });

  // actualizo stats
  hitsTextEl.textContent = String(hits);
  failsTextEl.textContent = String(fails);

  nextBtn.disabled = false;
}

function nextQuestion() {
  safePlay(sounds.click);
  currentIndex += 1;
  loadQuestion();
}

function endGame() {
  safePlay(sounds.finish);

  // calcular accuracy
  const total = getTotalQuestions();
  const accuracy = total === 0 ? 0 : Math.round((hits / total) * 100);

  // Mensaje personalizado
  const playerName = (playerInput.value || "Player").trim();
  let msg = "";

  if (accuracy >= 90) msg = `Amazing, ${playerName}! You're on fire 🔥`;
  else if (accuracy >= 70) msg = `Great job, ${playerName}! Keep going 💪`;
  else if (accuracy >= 50) msg = `Nice try, ${playerName}! Practice a bit more 🙂`;
  else msg = `Don't worry, ${playerName}! Review and try again 🌱`;

  // llenar cards
  scorePointsEl.textContent = String(score);
  scoreAccuracyEl.textContent = `${accuracy}%`;
  scoreStreakEl.textContent = String(bestStreak);
  finalMessageEl.textContent = msg;

  // llenar tabla
  scoreRowsEl.innerHTML = "";
  historyRows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.round}</td>
      <td>${r.answer}</td>
      <td><span class="pill ${r.result === "Correct" ? "ok" : "bad"}">
        ${r.result === "Correct" ? "Correct" : "Wrong"}
      </span></td>
      <td>${r.time}</td>
      <td>${r.points}</td>
    `;
    scoreRowsEl.appendChild(tr);
  });

  // ir a vista score
  vScore.checked = true;
}

// =====================
// EVENTS (event listeners)
// =====================
optionButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    safePlay(sounds.click);
    handleAnswer(btn.dataset.choice, false);
  });
});

nextBtn.addEventListener("click", nextQuestion);

// Iniciar juego
if (startBtn) {
  startBtn.addEventListener("click", () => {
    applyDifficulty();
    resetGame();
    vGame.checked = true;
    loadQuestion();
  });
}

// Si el usuario cambia a "Juego" manualmente desde el nav, arrancamos si no inició
document.querySelector('label.nav-link[for="v-game"]')?.addEventListener("click", () => {
  // si todavía no hay pregunta cargada, iniciamos
  if (currentIndex === 0 && hits === 0 && fails === 0 && historyRows.length === 0) {
    applyDifficulty();
    resetGame();
    loadQuestion();
  }
});

// Si vuelve a Inicio, paramos timer
document.querySelector('label.nav-link[for="v-start"]')?.addEventListener("click", () => {
  stopTimer();
});
