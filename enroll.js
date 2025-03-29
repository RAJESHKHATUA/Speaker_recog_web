document.addEventListener('DOMContentLoaded', () => {
    // ================== SENTENCES DATA ==================
    const sentences = [
        "Hello, my name is [Name].",
        "I am [Name], present today.",
        // ... (include all your sentences)
    ];

    // ================== UI SETUP ==================
    const grid = document.getElementById('sentencesGrid');
    grid.innerHTML = ''; // Clear existing content

    // Create all sentence cards
    sentences.forEach((text, index) => {
        const card = document.createElement('div');
        card.className = 'sentence-card';
        card.innerHTML = `
            <p class="sentence-text">${text}</p>
            <div class="controls">
                <button class="startBtn" data-index="${index}">🎤 Start</button>
                <button class="stopBtn" data-index="${index}" disabled>⏹️ Stop</button>
                <span class="status">Ready</span>
            </div>
            <audio class="preview" controls hidden></audio>
        `;
        grid.appendChild(card);
    });

    // ================== RECORDING LOGIC ==================
    let recordings = Array(sentences.length).fill(null);
    let activeRecorder = null;
    let mediaStream = null;

    // Add event listeners using event delegation
    grid.addEventListener('click', (e) => {
        const startBtn = e.target.closest('.startBtn');
        const stopBtn = e.target.closest('.stopBtn');
        
        if (startBtn) {
            handleStartRecording(startBtn);
        } else if (stopBtn) {
            handleStopRecording(stopBtn);
        }
    });

    async function handleStartRecording(button) {
        const index = parseInt(button.dataset.index);
        const card = button.closest('.sentence-card');
        const stopBtn = card.querySelector('.stopBtn');
        const status = card.querySelector('.status');
        const audio = card.querySelector('.preview');

        try {
            // Stop any existing recording
            if (activeRecorder?.state !== 'inactive') {
                activeRecorder?.stop();
                mediaStream?.getTracks().forEach(track => track.stop());
            }

            // Start new recording
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(mediaStream);
            const chunks = [];
            
            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = () => {
                recordings[index] = new Blob(chunks, { type: 'audio/wav' });
                audio.src = URL.createObjectURL(recordings[index]);
                audio.hidden = false;
                status.textContent = 'Recorded ✅';
                checkCompletion();
            };

            recorder.start();
            activeRecorder = recorder;
            
            // Update UI
            button.disabled = true;
            stopBtn.disabled = false;
            status.textContent = 'Recording...';
            
        } catch (err) {
            console.error("Recording failed:", err);
            status.textContent = 'Failed ❌';
            alert("Could not access microphone. Please check permissions.");
        }
    }

    function handleStopRecording(button) {
        const card = button.closest('.sentence-card');
        const startBtn = card.querySelector('.startBtn');
        
        if (activeRecorder?.state !== 'inactive') {
            activeRecorder.stop();
            startBtn.disabled = false;
            button.disabled = true;
            mediaStream?.getTracks().forEach(track => track.stop());
        }
    }

    // ================== SUPABASE INIT & UPLOAD ==================
    const supabase = supabase.createClient(
        "https://zbbheudcarcgdgnwrxim.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiYmhldWRjYXJjZ2RnbndyeGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNTc5MzIsImV4cCI6MjA1ODczMzkzMn0.VHW2KYkMB7PtLVNmP9fUDJY0oERCjPEgh8cVtLxljWI"
    );

    document.getElementById('submitVoice').addEventListener('click', async () => {
        // ... (keep your existing upload logic)
    });

    function checkCompletion() {
        document.getElementById('submitVoice').disabled = !recordings.every(r => r !== null);
    }
});