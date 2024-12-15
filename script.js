// 預設單字題庫
const defaultVocabulary = [
    {
        word: "Apple",
        options: ["蘋果", "香蕉", "橘子", "葡萄"],
        correctAnswer: 0
    },
    {
        word: "Book",
        options: ["電視", "書本", "電腦", "手機"],
        correctAnswer: 1
    },
    {
        word: "Cat",
        options: ["狗", "兔子", "貓", "鳥"],
        correctAnswer: 2
    },
    {
        word: "House",
        options: ["公園", "商店", "學校", "房子"],
        correctAnswer: 3
    },
    {
        word: "Water",
        options: ["水", "茶", "咖啡", "牛奶"],
        correctAnswer: 0
    }
];

let vocabularyQuestions = [...defaultVocabulary];
let currentQuestion = 0;
let score = 0;
let timer;
let timeLeft;
let hasAnswered = false;

// DOM elements
const wordElement = document.getElementById('word');
const optionsElement = document.getElementById('options');
const resultElement = document.getElementById('result');
const nextButton = document.getElementById('next');
const scoreElement = document.getElementById('score');
const timeElement = document.getElementById('time');
const soundButton = document.getElementById('sound');
const fileInput = document.getElementById('file-input');
const downloadTemplate = document.getElementById('download-template');
const quizSection = document.getElementById('quiz-section');

// 檔案上傳處理
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const csvData = e.target.result;
                const vocabulary = parseCSV(csvData);
                if (vocabulary.length > 0) {
                    vocabularyQuestions = vocabulary;
                    resetQuiz();
                    quizSection.style.display = 'block';
                } else {
                    alert('單字表格式錯誤或是沒有資料');
                }
            } catch (error) {
                alert('檔案讀取錯誤：' + error.message);
            }
        };
        reader.readAsText(file);
    }
});

// 解析 CSV 檔案
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    return lines
        .filter(line => line.trim() !== '')
        .map(line => {
            const [word, ...translations] = line.split(',').map(item => item.trim());
            if (!word || translations.length < 4) {
                throw new Error('CSV 格式錯誤，每行必須包含一個英文單字和四個中文翻譯');
            }
            return {
                word: word,
                options: translations.slice(0, 4),
                correctAnswer: 0 // 第一個翻譯為正確答案
            };
        });
}

// 下載範例單字表
downloadTemplate.addEventListener('click', function(e) {
    e.preventDefault();
    const template = defaultVocabulary
        .map(item => [item.word, ...item.options].join(','))
        .join('\n');
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '單字表範例.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
});

// 重置測驗
function resetQuiz() {
    currentQuestion = 0;
    score = 0;
    scoreElement.textContent = '0';
    clearInterval(timer);
    showQuestion();
}

// 播放單字發音
function playWordSound() {
    const word = vocabularyQuestions[currentQuestion].word;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
}

// 顯示當前題目
function showQuestion() {
    const question = vocabularyQuestions[currentQuestion];
    wordElement.textContent = question.word;
    hasAnswered = false;
    
    // 清除前一題的選項和結果
    optionsElement.innerHTML = '';
    resultElement.textContent = '';
    nextButton.style.display = 'none';

    // 創建選項按鈕
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option;
        button.addEventListener('click', () => checkAnswer(index));
        optionsElement.appendChild(button);
    });

    // 重置並開始計時器
    startTimer();
}

// 開始計時器
function startTimer() {
    timeLeft = 15;
    timeElement.textContent = timeLeft;
    
    if (timer) {
        clearInterval(timer);
    }
    
    timer = setInterval(() => {
        timeLeft--;
        timeElement.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            if (!hasAnswered) {
                timeIsUp();
            }
        }
    }, 1000);
}

// 時間到
function timeIsUp() {
    hasAnswered = true;
    clearInterval(timer);
    
    const question = vocabularyQuestions[currentQuestion];
    const options = document.querySelectorAll('.option-btn');
    
    options.forEach((option, index) => {
        option.disabled = true;
        if (index === question.correctAnswer) {
            option.classList.add('correct');
        }
    });

    resultElement.textContent = '時間到！正確答案是：' + question.options[question.correctAnswer];
    resultElement.style.color = 'red';
    nextButton.style.display = 'block';
}

// 檢查答案
function checkAnswer(selectedIndex) {
    if (hasAnswered) return;
    
    hasAnswered = true;
    clearInterval(timer);
    
    const question = vocabularyQuestions[currentQuestion];
    const options = document.querySelectorAll('.option-btn');
    
    options.forEach(option => {
        option.disabled = true;
    });

    if (selectedIndex === question.correctAnswer) {
        options[selectedIndex].classList.add('correct');
        resultElement.textContent = '答對了！';
        resultElement.style.color = 'green';
        score++;
        scoreElement.textContent = score;
    } else {
        options[selectedIndex].classList.add('incorrect');
        options[question.correctAnswer].classList.add('correct');
        resultElement.textContent = '答錯了！正確答案是：' + question.options[question.correctAnswer];
        resultElement.style.color = 'red';
    }

    nextButton.style.display = 'block';
}

// 顯示最終結果
function showFinalResult() {
    wordElement.textContent = '';
    optionsElement.innerHTML = '';
    soundButton.style.display = 'none';
    timeElement.parentElement.style.display = 'none';
    
    resultElement.textContent = `測驗完成！總分：${score} / ${vocabularyQuestions.length}`;
    
    // 添加重新開始按鈕
    const restartButton = document.createElement('button');
    restartButton.textContent = '重新開始';
    restartButton.className = 'next-btn';
    restartButton.addEventListener('click', () => {
        soundButton.style.display = 'block';
        timeElement.parentElement.style.display = 'block';
        resetQuiz();
    });
    optionsElement.appendChild(restartButton);
}

// 初始化事件監聽器
nextButton.addEventListener('click', () => {
    currentQuestion++;
    if (currentQuestion < vocabularyQuestions.length) {
        showQuestion();
    } else {
        showFinalResult();
    }
});

soundButton.addEventListener('click', playWordSound);
