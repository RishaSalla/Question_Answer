// المتغيرات العامة
let currentScore = 0;
let currentQuestionIndex = 0;
let gameData = [];

// عناصر الصفحة
const ui = {
    questionText: document.getElementById('question-text'),
    scoreCounter: document.getElementById('score-counter'),
    board: document.getElementById('game-board'),
    input: document.getElementById('answer-input'),
    messageArea: document.getElementById('message-area'),
    submitBtn: document.getElementById('submit-btn'),
    wrongBtn: document.getElementById('wrong-answer-btn'),
    nextBtn: document.getElementById('next-question-btn')
};

// تشغيل اللعبة عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    fetchQuestions();
    setupEventListeners();
});

// جلب الأسئلة
async function fetchQuestions() {
    try {
        const response = await fetch('data/questions.json');
        if (!response.ok) throw new Error("فشل تحميل ملف الأسئلة");
        gameData = await response.json();
        loadQuestion(currentQuestionIndex);
    } catch (error) {
        console.error(error);
        ui.questionText.innerText = "خطأ: تأكد من تشغيل اللعبة عبر سيرفر محلي (Live Server)";
        ui.questionText.style.color = "red";
    }
}

// عرض السؤال والبطاقات
function loadQuestion(index) {
    if (index >= gameData.length) {
        ui.questionText.innerText = "انتهت الأسئلة!";
        ui.board.innerHTML = "";
        return;
    }

    const data = gameData[index];
    ui.questionText.innerText = data.question;
    ui.board.innerHTML = ''; 
    ui.messageArea.innerText = '';
    ui.input.value = '';

    data.answers.forEach((ans, i) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-${i}`;
        
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">${i + 1}</div>
                <div class="card-back">
                    <span>${ans.text}</span>
                    <span class="points-badge">${ans.points}</span>
                </div>
            </div>
        `;
        ui.board.appendChild(card);
    });
}

// التحقق من الإجابة
function checkAnswer() {
    const userText = normalizeText(ui.input.value);
    if (!userText) return;

    let found = false;
    const currentAnswers = gameData[currentQuestionIndex].answers;

    currentAnswers.forEach((ans, i) => {
        if (normalizeText(ans.text) === userText) {
            const card = document.getElementById(`card-${i}`);
            if (!card.classList.contains('flipped')) {
                card.classList.add('flipped');
                currentScore += ans.points;
                ui.scoreCounter.innerText = currentScore;
                found = true;
                ui.messageArea.innerText = "✅ إجابة صحيحة!";
                ui.messageArea.style.color = "green";
                ui.input.value = ''; 
            }
        }
    });

    if (!found) {
        ui.messageArea.innerText = "❌ إجابة خاطئة!";
        ui.messageArea.style.color = "red";
    }
}

// توحيد النصوص (لتجاهل الهمزات والتاء المربوطة)
function normalizeText(text) {
    if (!text) return "";
    let normalized = text.trim();
    normalized = normalized.replace(/([^\u0621-\u063A\u0641-\u064A\u0660-\u0669a-zA-Z 0-9])/g, ''); // إزالة التشكيل
    normalized = normalized.replace(/(آ|إ|أ)/g, 'ا');
    normalized = normalized.replace(/(ة)/g, 'ه');
    normalized = normalized.replace(/(ى)/g, 'ي');
    if (normalized.startsWith("ال") && normalized.length > 3) normalized = normalized.substring(2);
    return normalized;
}

// تفعيل الأزرار
function setupEventListeners() {
    ui.submitBtn.addEventListener('click', checkAnswer);
    ui.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });
    ui.wrongBtn.addEventListener('click', () => {
        ui.messageArea.innerText = "خطأ X";
        ui.messageArea.style.color = "red";
    });
    ui.nextBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        loadQuestion(currentQuestionIndex);
    });
}
