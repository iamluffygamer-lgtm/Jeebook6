// No import statements needed!

// ✅ Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDhhzGvw56W5PtEzrkINiqATRZ5V3AJ5R8",
  authDomain: "jee-test-c9635.firebaseapp.com",
  databaseURL: "https://jee-test-c9635-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "jee-test-c9635",
  storageBucket: "jee-test-c9635.appspot.com",
  messagingSenderId: "154659057457",
  appId: "1:154659057457:web:3a1d82d9046ede05088a10"
};


// ✅ Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let nickname = "";
let score = 0, time = 0, timerInterval;
let currentQuestions = [], currentIndex = 0;
let chapterName = "", subject = "";

// ✅ Save score chapter-wise
function saveScore(name, chapter, score, total, timeTaken) {
    const scoresRef = db.ref(`leaderboards/${chapter}`);
    scoresRef.push({
        name,
        score,
        total,
        timeTaken,
        date: new Date().toISOString()
    });
}

// ✅ Load leaderboard sorted (highest first, fastest wins tie)
function loadLeaderboard(chapter) {
    const scoresRef = db.ref(`leaderboards/${chapter}`);
    scoresRef.orderByChild("score").limitToLast(10).once("value", snapshot => {
        const leaderboardList = document.getElementById("leaderboard");
        leaderboardList.innerHTML = "";
        let results = [];
        snapshot.forEach(child => {
            results.push(child.val());
        });
        results.sort((a, b) => {
            if (b.score === a.score) {
                return a.timeTaken - b.timeTaken;
            }
            return b.score - a.score;
        });
        results.forEach((data, i) => {
            const li = document.createElement("li");
            li.textContent = `#${i + 1} ${data.name} – ${data.score}/${data.total} (${data.timeTaken}s)`;
            leaderboardList.appendChild(li);
        });
    });
}

// Quiz Logic
// Step 1: Save name
document.getElementById("save-name").addEventListener("click", () => {
  const input = document.getElementById("nickname").value.trim();
  if (!input) return alert("Enter your name first!");
  nickname = input;
  document.getElementById("name-section").classList.add("hidden");
  document.getElementById("selection-section").classList.remove("hidden");
  loadChapters("physics");
});

// Load chapters for subject
function loadChapters(subj) {
  subject = subj;
  fetch(`questions/${subj}.json`)
    .then(res => res.json())
    .then(data => {
      const chapterSelect = document.getElementById("chapter");
      chapterSelect.innerHTML = "";
      Object.keys(data).forEach(ch => {
        const opt = document.createElement("option");
        opt.value = ch;
        opt.textContent = ch;
        chapterSelect.appendChild(opt);
      });
    });
}

// Step 2: Start quiz
document.getElementById("start-quiz").addEventListener("click", () => {
  chapterName = document.getElementById("chapter").value;
  fetch(`questions/${subject}.json`)
    .then(res => res.json())
    .then(data => {
      currentQuestions = data[chapterName];
      currentIndex = 0;
      score = 0;
      time = 0;
      document.getElementById("selection-section").classList.add("hidden");
      document.getElementById("quiz-section").classList.remove("hidden");
      timerInterval = setInterval(() => {
        time++;
        document.getElementById("timer").textContent = `Time: ${time}s`;
      }, 1000);
      showQuestion();
    });
});

// Display question
function showQuestion() {
  const q = currentQuestions[currentIndex];
  const container = document.getElementById("question-container");
  container.innerHTML = `<h3>Q${currentIndex + 1}: ${q.question}</h3>`;
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.className = "option-btn";
    btn.onclick = () => selectAnswer(i, q.answer, q.solution, btn);
    container.appendChild(btn);
  });
  document.getElementById("next-btn").classList.add("hidden");
}

// Check answer
function selectAnswer(i, correct, solution, btn) {
  const options = document.querySelectorAll(".option-btn");
  options.forEach(b => b.disabled = true);
  if (i === correct) {
    btn.classList.add("correct");
    score += 4;
  } else {
    btn.classList.add("wrong");
    options[correct].classList.add("correct");
    score -= 1;
  }
  document.getElementById("score").textContent = `Score: ${score}`;
  const sol = document.createElement("p");
  sol.textContent = "Solution: " + solution;
  document.getElementById("question-container").appendChild(sol);

  if (currentIndex < currentQuestions.length - 1) {
    document.getElementById("next-btn").classList.remove("hidden");
  } else {
    setTimeout(finishQuiz, 1000);
  }
}

// Next question
document.getElementById("next-btn").addEventListener("click", () => {
  currentIndex++;
  showQuestion();
});

// Finish quiz
function finishQuiz() {
  clearInterval(timerInterval);
  document.getElementById("quiz-section").classList.add("hidden");
  document.getElementById("result-section").classList.remove("hidden");
  document.getElementById("final-score").textContent = `${nickname}, your final score is ${score} in ${time}s`;

   // ✅ Save & Load Firebase Leaderboard
  saveScore(nickname, chapterName, score, currentQuestions.length, time);
  loadLeaderboard(chapterName);
}