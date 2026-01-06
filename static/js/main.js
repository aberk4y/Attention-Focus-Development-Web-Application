let CURRENT_MODE = 'training';

document.addEventListener('DOMContentLoaded', () => {
    
    const urlParams = new URLSearchParams(window.location.search);
    const activeTest = urlParams.get('test'); 
    const startBtn = document.getElementById('start-button');
    const stimulusArea = document.getElementById('stimulus-area');

    if(startBtn) {
        
        if (!activeTest && window.location.pathname.includes('/analysis')) {
            document.getElementById('test-title').innerText = "Günlük Analiz";
            document.getElementById('test-description').innerText = "4 test (Stroop, CPT, SRT ve N-Back) arka arkaya uygulanacaktır. Hazır olduğunda başlat.";
            startBtn.onclick = startDailyAnalysis; 
        }
        
        else {
            CURRENT_MODE = 'training';
            
            const desc = document.getElementById('test-description');
            if (desc) desc.innerText = "Bu bir antrenman modudur. Skorunuz genel ortalamaya yansımaz.";

            if (activeTest === 'cpt') {
                document.getElementById('test-title').innerText = "CPT Antrenmanı";
                startBtn.onclick = startCPT;
            } else if (activeTest === 'srt') {
                document.getElementById('test-title').innerText = "SRT Antrenmanı";
                startBtn.onclick = startSRT;
            } else if (activeTest === 'stroop') {
                document.getElementById('test-title').innerText = "Stroop Antrenmanı";
                startBtn.onclick = startStroop;
            } else if (activeTest === 'nback') { 
                document.getElementById('test-title').innerText = "N-Back Antrenmanı";
                
                startBtn.onclick = function() {
                    if(typeof startNBack === "function") startNBack();
                };
            }
        }
    }
    
    if(stimulusArea) {
        
        stimulusArea.addEventListener('mousedown', () => {
            if (window.activeTestName === 'SRT' && stimulusArea.style.display !== 'none') {
                if(typeof handleSRTClick === 'function') handleSRTClick();
            }
        });
    }
    
   
    document.addEventListener('keydown', (e) => {
        if (!stimulusArea || stimulusArea.style.display === 'none') return;
        if (window.activeTestName === 'SRT') return; 
        
       
        if ((window.activeTestName === 'CPT' || window.activeTestName === 'N-Back') && stimulusArea.dataset.cevaplandi === "evet") return;

        let basilantus = '';
        const key = e.key.toLowerCase();
        
        if (key === 'q') basilantus = 'kirmizi';
        if (key === 'p') basilantus = 'mavi';
        if (key === ' ' || e.code === 'Space') basilantus = 'space';
        
        if (basilantus !== '') {
            const sure = Date.now() - window.startTime; 
            const dogruCevap = stimulusArea.dataset.dogruCevap;
            
            
            if (window.activeTestName === 'CPT') {
                cptData.push({ dogru: dogruCevap, cevap: basilantus, sure: sure });
                stimulusArea.dataset.cevaplandi = "evet"; 
                stimulusArea.style.color = '#ccc'; 
            } 
            else if (window.activeTestName === 'N-Back') {
                nbackData.push({ dogru: dogruCevap, cevap: basilantus, sure: sure });
                stimulusArea.dataset.cevaplandi = "evet";
                stimulusArea.style.color = '#ccc';
            }
            else if (window.activeTestName === 'Stroop') {
                if (typeof timeOutTimer !== 'undefined' && timeOutTimer) clearTimeout(timeOutTimer);
                stroopData.push({ dogru: dogruCevap, cevap: basilantus, sure: sure });
                nextStroopQuestion();
            }
        }
    });
});

function updateProgressBar(percent) {
    const container = document.getElementById('progress-container');
    const bar = document.getElementById('progress-bar');
    
    if (container && bar) {
        container.style.display = 'block'; // İlk test başladığında görünür yap
        bar.style.width = percent + "%";
    }
}


function startDailyAnalysis() {
    CURRENT_MODE = 'analysis'; 
    updateProgressBar(5);
    startStroop(); 
}