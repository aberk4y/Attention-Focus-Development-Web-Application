let nbackData = [];
let nbackTrialCount = 0;
const NBACK_MAX_TRIALS = 30; 
const N_BACK_LEVEL = 2; 
let nbackHistory = [];
let nbackTimer = null;

const NBACK_STIMULUS_DURATION = 800; 
const NBACK_BLANK_DURATION = 800; 


if (!window.nbackListenerAdded) {
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && window.activeTestName === 'N-Back') {
            const alan = document.getElementById('stimulus-area');
            if (alan && alan.dataset.cevaplandi === "hayir") {
                alan.dataset.cevaplandi = "evet";
                const reactionTime = Date.now() - window.startTime;
                const isCorrect = (alan.dataset.dogruCevap === 'space');
                
                if(!isCorrect) alan.style.color = "red";

                nbackData.push({
                    dogru: alan.dataset.dogruCevap,
                    cevap: 'space',
                    sure: reactionTime
                });
            }
        }
    });
    window.nbackListenerAdded = true;
}

function startNBack() {
    window.activeTestName = 'N-Back';
    nbackData = [];
    nbackTrialCount = 0;
    nbackHistory = [];
    
    const alan = document.getElementById('stimulus-area');
    
    
    alan.style.display = 'flex';
    alan.style.justifyContent = 'center';
    alan.style.alignItems = 'center';
    alan.style.backgroundColor = '#3bce78ff';
    alan.style.backgroundColor.witdh = '300px';
    alan.style.width = '300px';
    alan.style.fontFamily = 'Arial, sans-serif'; 
    alan.style.fontSize = '72px';
    alan.style.fontWeight = 'bold';
    alan.style.color = 'white';
    alan.style.borderRadius = '15px';
    alan.style.height = '200px'; 
    alan.style.transition = 'all 0.2s';

    document.getElementById('test-title').innerText = "Son Aşama: N-Back Testi";
    document.getElementById('test-description').innerText = 
        `Şu anki harf, ${N_BACK_LEVEL} adım öncekiyle AYNIYSA Boşluk tuşuna bas.`;
    document.getElementById('start-button').style.display = 'none'; 
    
    nextNBackStimulus();
}


function getNextNBackLetter() {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'R', 'S', 'T', 'Z'];
    const targetMatchRatio = 0.30; 

    if (nbackHistory.length >= N_BACK_LEVEL && Math.random() < targetMatchRatio) {
        return nbackHistory[nbackHistory.length - N_BACK_LEVEL];
    }
    return letters[Math.floor(Math.random() * letters.length)];
}

function nextNBackStimulus() {
    if(nbackTimer) clearTimeout(nbackTimer); 

    if (nbackTrialCount >= NBACK_MAX_TRIALS) {
        finishNBack();
        return;
    }

    const alan = document.getElementById('stimulus-area');
    alan.innerText = ""; 
    alan.dataset.cevaplandi = "bekliyor";

    setTimeout(() => {
        nbackTrialCount++;
        const currentLetter = getNextNBackLetter();
        
        let isMatch = false;
        if (nbackHistory.length >= N_BACK_LEVEL) {
            if (currentLetter === nbackHistory[nbackHistory.length - N_BACK_LEVEL]) {
                isMatch = true;
            }
        }
        
        nbackHistory.push(currentLetter);
        alan.innerText = currentLetter;
        alan.style.color = "white"; 
        alan.dataset.dogruCevap = isMatch ? 'space' : 'yok';
        alan.dataset.cevaplandi = "hayir"; 
        window.startTime = Date.now();

        nbackTimer = setTimeout(() => {
            
            if (alan.dataset.cevaplandi === "hayir") {
                nbackData.push({
                    dogru: alan.dataset.dogruCevap,
                    cevap: 'yok',
                    sure: NBACK_STIMULUS_DURATION 
                });
            }
            nextNBackStimulus();
        }, NBACK_STIMULUS_DURATION);

    }, NBACK_BLANK_DURATION);
}

function finishNBack() {
    if(nbackTimer) clearTimeout(nbackTimer);
    window.activeTestName = null; 
    
    const alan = document.getElementById('stimulus-area');
    alan.style.display = 'none';
    
    if(typeof updateProgressBar === "function") updateProgressBar(100);
    document.getElementById('test-title').innerText = "Kaydediliyor.."; 
    
    fetch('/save_result', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            test_name: 'N-Back',
            mode: typeof CURRENT_MODE !== 'undefined' ? CURRENT_MODE : 'test',
            results: nbackData
        })
    })
    .then(response => response.json())
    .then(data => {
        const btn = document.getElementById('start-button');
        btn.style.display = 'inline-block';

        if (typeof CURRENT_MODE !== 'undefined' && CURRENT_MODE === 'analysis') {
            document.getElementById('test-title').innerText = "Analiz Tamamlandı!";
            document.getElementById('test-description').innerText = "Tüm test aşamalarını başarıyla bitirdiniz.";
            btn.innerText = "Panele Dön";
            btn.className = "ana-buton mavi-buton";
            btn.onclick = () => { window.location.href = '/dashboard'; };
        } else {
            document.getElementById('test-title').innerText = "Sonuçlar";
            document.getElementById('test-description').innerText = `Doğruluk: %${data.accuracy || 0} - Hız: ${data.speed || 0} ms`;
            btn.innerText = "Tekrar Dene";
            btn.onclick = startNBack;
        }
    })
    .catch(err => {
        console.error("Hata:", err);
        document.getElementById('test-title').innerText = "Bağlantı Hatası";
    });
}