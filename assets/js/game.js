// المتغيرات العامة للعبة
let currentScore = 0;
let currentQuestionIndex = 0;
let gameData = []; // هنا سنخزن الأسئلة القادمة من الملف

// عناصر DOM التي سنحتاج للتحكم بها
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

// --- 1. تشغيل اللعبة عند البداية ---
document.addEventListener('DOMContentLoaded', () => {
    fetchQuestions();
    setupEventListeners();
});

// --- 2. جلب الأسئلة من ملف JSON ---
async function fetchQuestions() {
    try {
        const response = await fetch('data/questions.json');
        if (!response.ok) throw new Error("لم نتمكن من قراءة ملف الأسئلة");
        
        gameData = await response.json();
        loadQuestion(currentQuestionIndex);
        
    } catch (error) {
        console.error("Error loading questions:", error);
        ui.questionText.innerText = "تنبيه: لا يمكن قراءة ملف البيانات محلياً مباشرة بسبب حماية المتصفح.\n يرجى تشغيل 'Live Server' أو رفع الملفات على سيرفر.";
        ui.questionText.style.color = "red";
        ui.questionText.style.fontSize = "1rem";
    }
}

// --- 3. عرض السؤال والبطاقات ---
function loadQuestion(index) {
    // التأكد من وجود أسئلة
    if (index >= gameData.length) {
        ui.questionText.innerText = "انتهت جميع الأسئلة! 🥳";
        ui.board.innerHTML = "";
        return;
    }

    const data = gameData[index];
    ui.questionText.innerText = data.question;
    ui.board.innerHTML = ''; // تنظيف البورد
    ui.messageArea.innerText = '';
    ui.input.value = '';

    // توليد البطاقات
    data.answers.forEach((ans, i) => {
        // إنشاء عنصر البطاقة HTML
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-${i}`;
        card.dataset.text = ans.text;   // تخزين النص للمقارنة
        card.dataset.points = ans.points; // تخزين النقاط

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">${i + 1}</div>
                <div class="card-back">
                    <span>${ans.text}</span>
                    <span class="points-badge">${ans.points}</span>
                </div>
            </div>
        `;
        
        // (اختياري) السماح بقلب البطاقة بالضغط عليها مباشرة
        card.addEventListener('click', () => flipCard(card, ans.points));
        
        ui.board.appendChild(card);
    });
}

// --- 4. معالجة الإدخال (التأكد من الإجابة) ---
function checkAnswer() {
    const userText = normalizeText(ui.input.value);
    if (!userText) return;

    let found = false;
    const currentAnswers = gameData[currentQuestionIndex].answers;

    // البحث في الإجابات
    currentAnswers.forEach((ans, i) => {
        // إذا تطابق النص ولم تكن البطاقة مقلوبة مسبقاً
        if (normalizeText(ans.text) === userText) {
            const card = document.getElementById(`card-${i}`);
            if (!card.classList.contains('flipped')) {
                flipCard(card, ans.points);
                found = true;
            } else {
                showMessage("تم كشف هذه الإجابة مسبقاً!", "orange");
                found = true;
            }
        }
    });

    if (!found) {
        showMessage("❌ إجابة خاطئة!", "red");
        triggerWrongEffect();
    } else {
        showMessage("✅ إجابة صحيحة!", "green");
        ui.input.value = ''; // تفريغ الخانة فقط عند الإجابة الصحيحة
    }
    
    ui.input.focus(); // إعادة المؤشر للكتابة
}

// --- 5. وظيفة قلب البطاقة واحتساب النقاط ---
function flipCard(cardElement, points) {
    if (cardElement.classList.contains('flipped')) return;
    
    cardElement.classList.add('flipped');
    currentScore += points;
    updateScore();
}

function updateScore() {
    ui.scoreCounter.innerText = currentScore;
}

// --- 6. خوارزمية توحيد النصوص (الذكاء) ---
function normalizeText(text) {
    if (!text) return "";
    let normalized = text.trim();
    
    // إزالة التشكيل
    normalized = normalized.replace(/([^\u0621-\u063A\u0641-\u064A\u0660-\u0669a-zA-Z 0-9])/g, '');
    
    // توحيد الألف (أ إ آ -> ا)
    normalized = normalized.replace(/(آ|إ|أ)/g, 'ا');
    
    // توحيد التاء المربوطة والهاء (ة -> ه)
    normalized = normalized.replace(/(ة)/g, 'ه');
    
    // توحيد الياء (ى -> ي)
    normalized = normalized.replace(/(ى)/g, 'ي');

    // إزالة "ال" التعريف من البداية (اختياري، يسهل اللعب)
    if (normalized.startsWith("ال") && normalized.length > 3) {
        normalized = normalized.substring(2);
    }

    return normalized;
}

// --- 7. المؤثرات والتحكم ---
function showMessage(msg, color) {
    ui.messageArea.innerText = msg;
    ui.messageArea.style.color = color;
    setTimeout(() => { ui.messageArea.innerText = ''; }, 2000);
}

function triggerWrongEffect() {
    document.body.style.backgroundColor = "#500"; // وميض أحمر
    setTimeout(() => {
        document.body.style.backgroundColor = "var(--main-bg)";
    }, 200);
}

function setupEventListeners() {
    // زر الإدخال
    ui.submitBtn.addEventListener('click', checkAnswer);
    
    // زر Enter في لوحة المفاتيح
    ui.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });

    // زر الخطأ (X)
    ui.wrongBtn.addEventListener('click', () => {
        triggerWrongEffect();
        showMessage("خطـــــــأ !!", "red");
    });

    // زر السؤال التالي
    ui.nextBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        loadQuestion(currentQuestionIndex);
    });
}
