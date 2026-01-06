let stroopData = [];
let stroopTrialCount = 0;
const STROOP_MAX_TRIALS = 8; 
let timeOutTimer = null;

function startStroop() {
    window.activeTestName = 'Stroop';
    stroopData = [];
    stroopTrialCount = 0;
    
    document.getElementById('test-title').innerText = "1. Aşama: Stroop Testi";
    document.getElementById('test-description').innerText = "Yazının rengine odaklan - Q (Kırmızı) - P (Mavi) - Süre: 1sn";
    document.getElementById('start-button').style.display = 'none';
    document.getElementById('stimulus-area').style.display = 'flex';
    nextStroopQuestion();
}

function nextStroopQuestion() {
    if(timeOutTimer) clearTimeout(timeOutTimer);

    if (stroopTrialCount >= STROOP_MAX_TRIALS) {
        finishStroop();
        return;
    }
    
    stroopTrialCount++;
    const renkler = ['red', 'blue'];
    const kelimeler = ['KIRMIZI', 'MAVİ'];
    const randomRenk = renkler[Math.floor(Math.random() * renkler.length)];
    const randomKelime = kelimeler[Math.floor(Math.random() * kelimeler.length)];
    const alan = document.getElementById('stimulus-area');
    
    alan.innerText = randomKelime;
    alan.style.color = randomRenk;
    alan.dataset.dogruCevap = (randomRenk === 'red') ? 'kirmizi' : 'mavi';

    window.startTime = Date.now(); 
    
    timeOutTimer = setTimeout(() => {
        stroopData.push({
            dogru: alan.dataset.dogruCevap,
            cevap: 'pas',
            sure: 2000 
        });
        alan.innerText = "SÜRE DOLDU";
        alan.style.color = "black";
        setTimeout(nextStroopQuestion, 500);
    }, 1000); 
}

function finishStroop() {
    if(timeOutTimer) clearTimeout(timeOutTimer);
    document.getElementById('stimulus-area').style.display = 'none';
    if(typeof updateProgressBar === "function") updateProgressBar(25);
    document.getElementById('test-title').innerText = "Kaydediliyor..";
    
    fetch('/save_result', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            test_name: 'Stroop',
            mode: CURRENT_MODE, 
            results: stroopData
        })
    })
    .then(response => response.json())
    .then(data => {
        if (CURRENT_MODE === 'analysis') {
            document.getElementById('test-title').innerText = "Stroop Tamamlandı!";
            document.getElementById('test-description').innerText = "Stroop bitti.3 saniye içinde CPT testi başlayacak..";
            
            setTimeout(() => {
                startCPT(); 
            }, 3000);
            
        } else {
            document.getElementById('test-title').innerText = "Sonuçlar";
            document.getElementById('test-description').innerText = `Doğruluk: %${data.accuracy} - Hız: ${data.speed} ms`;
            const btn = document.getElementById('start-button');
            btn.style.display = 'inline-block';
            btn.innerText = "Tekrar Dene";
            btn.onclick = startStroop;
        }
    });
}