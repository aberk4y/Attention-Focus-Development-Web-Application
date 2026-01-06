let cptData = [];
let cptTrialCount = 0;
const CPT_MAX_TRIALS = 40; 
let cptTimer = null;


const STIMULUS_DURATION = 400; 
const BLANK_DURATION = 300;    

function startCPT() {
    window.activeTestName = 'CPT';
    cptData = [];
    cptTrialCount = 0;
    
    document.getElementById('test-title').innerText = "2. Aşama: CPT Testi";
    document.getElementById('test-description').innerText = "Sadece 'X' görünce BOŞLUK tuşuna bas.";
    document.getElementById('stimulus-area').style.display = 'flex';
    document.getElementById('start-button').style.display = 'none'; 
    nextCPTStimulus();
}

function nextCPTStimulus() {
    if (cptTrialCount >= CPT_MAX_TRIALS) {
        finishCPT();
        return;
    }

    const alan = document.getElementById('stimulus-area');
    
    
    alan.innerText = ""; 
    
    setTimeout(() => {
        cptTrialCount++;

        const letters = ['A', 'B', 'K', 'X','+', 'O', 'M', 'T', 'Y', 'Z', 'P', 'R', 'S'];
        const letter = letters[Math.floor(Math.random() * letters.length)];
        
        alan.innerText = letter;
        alan.style.color = 'black'; 
        alan.style.fontSize = '4.5rem';
        alan.dataset.dogruCevap = (letter === 'X') ? 'space' : 'yok';
        alan.dataset.cevaplandi = "hayir"; 

        window.startTime = Date.now();
        
        
        cptTimer = setTimeout(() => {
            
            if (alan.dataset.cevaplandi === "hayir") {
                cptData.push({
                    dogru: alan.dataset.dogruCevap,
                    cevap: 'yok',
                    sure: STIMULUS_DURATION 
                });
            }
            
            nextCPTStimulus();
        }, STIMULUS_DURATION); 

    }, BLANK_DURATION);
}

function finishCPT() {
    clearTimeout(cptTimer);
    document.getElementById('stimulus-area').style.display = 'none';
    if(typeof updateProgressBar === "function") updateProgressBar(50);
    document.getElementById('test-title').innerText = "Kaydedildi";
    
    fetch('/save_result', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            test_name: 'CPT',
            mode: CURRENT_MODE,
            results: cptData
        })
    })
    .then(response => response.json())
    .then(data => {
        if (CURRENT_MODE === 'analysis') {
            document.getElementById('test-title').innerText = "CPT Tamamlandı!";
            document.getElementById('test-description').innerText = "Son aşama 3 saniye içinde SRT testi başlayacak";
            
            setTimeout(() => {
                startSRT(); 
            }, 3000);
            
        } 
        else {
            document.getElementById('test-title').innerText = "Sonuçlar";
            document.getElementById('test-description').innerText = `Doğruluk: %${data.accuracy} - Hız: ${data.speed} ms`;
            const btn = document.getElementById('start-button');
            btn.style.display = 'inline-block';
            btn.innerText = "Tekrar Dene";
            btn.onclick = startCPT;
        }
    });
}