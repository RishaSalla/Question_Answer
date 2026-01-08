// --- المتغيرات العامة ---
let gameData = [];
let currentQuestionIndex = 0;
let team1Score = 0;
let team2Score = 0;
let roundPoints = 0; // النقاط المجمعة في السؤال الحالي

// --- تعريف الأصوات (سنفعلها لاحقاً لكن نجهز مكانها) ---
const sounds = {
    correct: new Audio('assets/sounds/correct.mp3'),
    wrong: new Audio('assets/sounds/wrong.mp3')
};

// --- عناصر التحكم في الواجهة ---
const ui = {
    screens: {
        setup: document.getElementById('setup-screen'),
        game: document.getElementById('game-screen')
    },
    inputs: {
        team1Name: document.getElementById('team1-name-input'),
        team2Name: document.getElementById('team2-name-input'),
        answer: document.getElementById('answer-input')
    },
    display: {
        team1Name: document.getElementById('team1-name-display'),
        team2Name: document.getElementById('team2-name-display'),
        score1: document.getElementById('score1'),
        score2: document.getElementById('score2'),
        question: document.getElementById('question-text'),
        board: document.getElementById('game-board'),
        msg: document.getElementById('message-area')
    },
    buttons: {
        start: document.getElementById('start-game-btn'),
        submit: document.getElementById('submit-btn'),
        wrong: document.getElementById('wrong-answer-btn'),
        next: document.getElementById('next-question-btn'),
        addTeam1: document.getElementById('add-team1'),
        addTeam2: document.getElementById('add-team2')
    }
};

// --- 1. تهيئة اللعبة ---
document.addEventListener('DOMContentLoaded', () => {
    // جلب الأسئلة
    fetch('data/questions.json')
        .then(res => res.json())
        .then(data => { gameData = data; })
        .catch(err => console.error("تأكد من تشغيل السيرفر", err));

    setupEvents();
});

function setupEvents() {
    // زر البدء
    ui.buttons.start.addEventListener('click', startGame);
    
    // زر كشف الإجابة
    ui.buttons.submit.addEventListener('click', checkAnswer);
    ui.inputs.answer.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });

    // زر الخطأ
    ui.buttons.wrong.addEventListener('click', () => showFeedback("❌ خطأ!", "red", true));

    // أزرار توزيع النقاط
    ui.buttons.addTeam1.addEventListener('click', () => assignPointsTo(1));
    ui.buttons.addTeam2.addEventListener('click', () => assignPointsTo(2));

    // زر السؤال التالي
    ui.buttons.next.addEventListener('click', nextQuestion);
}

// --- 2. بدء اللعبة والانتقال بين الشاشات ---
function startGame() {
    // نقل الأسماء
    ui.display.team1Name.innerText = ui.inputs.team1Name.value || "الفريق 1";
    ui.display.team2Name.innerText = ui.inputs.team2Name.value || "الفريق 2";

    // التبديل
    ui.screens.setup.classList.remove('active');
    ui.screens.setup.classList.add('hidden'); // تأكد من وجود كلاس hidden في css إذا لزم
    ui.screens.game.classList.remove('hidden');
    ui.screens.game.classList.add('active');

    loadQuestion(currentQuestionIndex);
}

// --- 3. منطق اللعبة ---
function loadQuestion(index) {
    if (index >= gameData.length) {
        ui.display.question.innerText = "انتهت المباراة! 🏁";
        ui.display.board.innerHTML = "";
        return;
    }

    const data = gameData[index];
    ui.display.question.innerText = data.question;
    ui.display.board.innerHTML = '';
    roundPoints = 0; // تصفير نقاط الجولة
    updateUI();

    data.answers.forEach((ans, i) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-${i}`;
        card.dataset.flipped = "false"; // حالة البطاقة
        
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">${i + 1}</div>
                <div class="card-back">
                    <span>${ans.text}</span>
                    <span class="points-badge">${ans.points}</span>
                </div>
            </div>
        `;
        ui.display.board.appendChild(card);
    });
}

function checkAnswer() {
    const text = normalizeText(ui.inputs.answer.value);
    if (!text) return;

    let found = false;
    const answers = gameData[currentQuestionIndex].answers;

    answers.forEach((ans, i) => {
        if (normalizeText(ans.text) === text) {
            const card = document.getElementById(`card-${i}`);
            if (card.dataset.flipped === "false") {
                flipCard(card, ans.points);
                found = true;
            } else {
                showFeedback("تم كشفها مسبقاً", "orange", false);
                found = true;
            }
        }
    });

    if (!found) showFeedback("إجابة خاطئة", "red", true);
    else ui.inputs.answer.value = ''; // مسح الخانة فقط إذا صح
}

function flipCard(card, points) {
    card.classList.add('flipped');
    card.dataset.flipped = "true";
    
    // إضافة النقاط للبنك المؤقت للجولة
    roundPoints += points;
    showFeedback(`✅ إجابة صحيحة (+${points})`, "green", false);
    
    // تشغيل الصوت (إذا وجد)
    try { sounds.correct.currentTime = 0; sounds.correct.play(); } catch(e){}
}

// --- 4. إدارة النقاط ---
function assignPointsTo(team) {
    if (roundPoints === 0) {
        alert("لا توجد نقاط مكتشفة لتضاف!");
        return;
    }

    if (team === 1) team1Score += roundPoints;
    else team2Score += roundPoints;

    roundPoints = 0; // تصفير البنك المؤقت
    updateUI();
    showFeedback(`تم تحويل النقاط للفريق ${team}`, "#0077b6", false);
}

function nextQuestion() {
    currentQuestionIndex++;
    loadQuestion(currentQuestionIndex);
}

function updateUI() {
    ui.display.score1.innerText = team1Score;
    ui.display.score2.innerText = team2Score;
}

function showFeedback(text, color, isWrong) {
    ui.display.msg.innerText = text;
    ui.display.msg.style.color = color;
    
    if (isWrong) {
        document.body.style.backgroundColor = "#500";
        try { sounds.wrong.currentTime = 0; sounds.wrong.play(); } catch(e){}
        setTimeout(() => document.body.style.backgroundColor = "var(--main-bg)", 200);
    }
    
    setTimeout(() => ui.display.msg.innerText = '', 2000);
}

// --- 5. خوارزمية النصوص ---
function normalizeText(text) {
    if (!text) return "";
    let n = text.trim();
    n = n.replace(/([^\u0621-\u063A\u0641-\u064A\u0660-\u0669a-zA-Z 0-9])/g, '');
    n = n.replace(/(آ|إ|أ)/g, 'ا').replace(/(ة)/g, 'ه').replace(/(ى)/g, 'ي');
    if (n.startsWith("ال") && n.length > 3) n = n.substring(2);
    return n;
}
