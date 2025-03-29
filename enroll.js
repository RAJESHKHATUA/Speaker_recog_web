document.addEventListener('DOMContentLoaded', () => {
    // ================== SENTENCES DATA ==================
    const sentences = [
        "Hello, my name is [Name].",
        "I am [Name], present today.",
        "Yes, I am here.",
        "This is [Name] speaking.",
        "[Name] here, marking my attendance."
    ];

    // ================== UI SETUP ==================
    const grid = document.getElementById('sentencesGrid');
    const submitBtn = document.getElementById('submitVoice');

    // Clear and create sentence cards
    grid.innerHTML = '';
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

    // Handle recording buttons
    grid.addEventListener('click', async (e) => {
        const startBtn = e.target.closest('.startBtn');
        const stopBtn = e.target.closest('.stopBtn');

        if (startBtn) {
            const index = parseInt(startBtn.dataset.index);
            const card = startBtn.closest('.sentence-card');
            const stopBtn = card.querySelector('.stopBtn');
            const status = card.querySelector('.status');
            const audio = card.querySelector('.preview');

            try {
                // Stop any existing recording
                if (activeRecorder?.state === 'recording') {
                    activeRecorder.stop();
                    mediaStream?.getTracks().forEach(track => track.stop());
                }

                // Start new recording
                mediaStream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true
                    } 
                });

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
                startBtn.disabled = true;
                stopBtn.disabled = false;
                status.textContent = 'Recording...';

            } catch (err) {
                console.error("Recording error:", err);
                status.textContent = 'Error ❌';
                alert("Microphone access required! Please allow permissions.");
            }
        }
        else if (stopBtn) {
            const card = stopBtn.closest('.sentence-card');
            const startBtn = card.querySelector('.startBtn');

            if (activeRecorder?.state === 'recording') {
                activeRecorder.stop();
                startBtn.disabled = false;
                stopBtn.disabled = true;
                mediaStream?.getTracks().forEach(track => track.stop());
            }
        }
    });

    // ================== SUBMIT HANDLER ==================
    submitBtn.addEventListener('click', () => {
        if (!recordings.every(r => r !== null)) {
            alert("Please record all sentences first!");
            return;
        }

        // Without Supabase, we'll just show the recordings
        console.log("All recordings completed:", recordings);
        alert("All recordings are ready! (Supabase upload removed)");
        
        // For testing: Play all recordings
        document.querySelectorAll('.preview').forEach(audio => {
            audio.play().catch(e => console.log("Playback error:", e));
        });
    });

    // ================== HELPER FUNCTIONS ==================
    function checkCompletion() {
        const allRecorded = recordings.every(r => r !== null);
        submitBtn.disabled = !allRecorded;
    }
});