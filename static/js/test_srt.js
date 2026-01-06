let srtData = [];
let srtTrialCount = 0;
const SRT_MAX_TRIALS = 5; 
let isGreen = false;
let waitingTimer = null;

function startSRT() {
    window.activeTestName = 'SRT';
    srtData = [];
    srtTrialCount = 0;
    
    document.getElementById('test-title').innerText = "3. Aşama: SRT Refleks Testi";
    document.getElementById('test-description').innerText = "Kutu YEŞİL olunca tıkla";
    
    const alan = document.getElementById('stimulus-area');
    alan.style.display = 'flex';
    alan.style.width = '100%';
    alan.style.height = '300px';
    alan.style.cursor = 'pointer';
    document.getElementById('start-button').style.display = 'none';
    nextSRTStimulus();
}

function nextSRTStimulus() {
    if (srtTrialCount >= SRT_MAX_TRIALS) {
        finishSRT();
        return;
    }
    
    srtTrialCount++;
    isGreen = false;
    const alan = document.getElementById('stimulus-area');
    alan.style.backgroundColor = '#dc3545'; 
    alan.innerText = "BEKLE...";
    const randomWait = Math.floor(Math.random() * 2000) + 1000; 
    
    waitingTimer = setTimeout(() => {
        isGreen = true;
        alan.style.backgroundColor = '#28a745'; 
        alan.innerText = "TIKLA!";
        window.startTime = Date.now();
    }, randomWait);
}

function handleSRTClick() {
    const alan = document.getElementById('stimulus-area');
    if (!isGreen) {
        clearTimeout(waitingTimer);
        alan.innerText = "ÇOK ERKEN";
        alan.style.backgroundColor = 'black';
        setTimeout(nextSRTStimulus, 1000);
        return;
    }
    
    const reactionTime = Date.now() - window.startTime;
    srtData.push({ dogru: 'tikla', cevap: 'tikla', sure: reactionTime });
    alan.innerText = `${reactionTime} ms`;
    setTimeout(nextSRTStimulus, 500);
}

function finishSRT() {
    const alan = document.getElementById('stimulus-area');
    alan.style.display = 'none';
    alan.style.height = 'auto'; 
    document.getElementById('test-title').innerText = "Kaydediliyor";
    
    fetch('/save_result', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            test_name: 'SRT',
            mode: CURRENT_MODE,
            results: srtData
        })
    })
    .then(response => response.json())
    .then(data => {
        
        if (CURRENT_MODE === 'analysis') {
            document.getElementById('test-title').innerText = "SRT Tamamlandı!";
            if(typeof updateProgressBar === "function") updateProgressBar(75);
            document.getElementById('test-description').innerText = "Final aşaması: N-Back testi 3 saniye içinde başlıyor...";
            
            setTimeout(() => {
                startNBack(); 
            }, 3000);
            
        } else {
            
            document.getElementById('test-title').innerText = "Sonuçlar";
            document.getElementById('test-description').innerText = `Hız: ${data.speed} ms`;

            const btn = document.getElementById('start-button');
            btn.style.display = 'inline-block';
            btn.innerText = "Tekrar Dene";
            btn.onclick = startSRT;
        }
    });
}