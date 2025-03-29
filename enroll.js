document.addEventListener('DOMContentLoaded', () => {
    // ========== FIRST CREATE UI ==========
    const sentences = [
        "Hello, my name is [Name].",
        "I am [Name], present today.", 
        "Yes, I am here.",
        "This is [Name] speaking.",
        "[Name] here, marking my attendance."
    ];

    const grid = document.getElementById('sentencesGrid');
    const submitBtn = document.getElementById('submitVoice');
    
    // Clear and create sentence cards
    grid.innerHTML = '';
    sentences.forEach((text, index) => {
        const card = document.createElement('div');
        card.className = 'sentence-card';
        card.innerHTML = `
            <p>${text}</p>
            <div class="controls">
                <button class="startBtn" data-index="${index}">🎤 Start</button>
                <button class="stopBtn" data-index="${index}" disabled>⏹️ Stop</button>
                <span class="status">Ready</span>
            </div>
            <audio class="preview" controls hidden></audio>
        `;
        grid.appendChild(card);
    });

    // ========== STATE MANAGEMENT ==========
    let recordings = Array(sentences.length).fill(null);
    let activeRecorder = null;
    let mediaStream = null;
    let supabaseEnabled = false;

    // ========== INITIALIZE SUPABASE (NON-BLOCKING) ==========
    setTimeout(async () => {
        try {
            const supabase = supabase.createClient(
                "https://zbbheudcarcgdgnwrxim.supabase.co",
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiYmhldWRjYXJjZ2RnbndyeGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNTc5MzIsImV4cCI6MjA1ODczMzkzMn0.VHW2KYkMB7PtLVNmP9fUDJY0oERCjPEgh8cVtLxljWI"
            );
            
            // Test connection
            const { data, error } = await supabase
                .from('nonexistent_table')
                .select('*')
                .limit(1);
                
            if (!error || error.message.includes('relation "nonexistent_table" does not exist')) {
                supabaseEnabled = true;
                console.log("Supabase connected successfully");
            } else {
                console.warn("Supabase limited functionality:", error.message);
            }
        } catch (err) {
            console.warn("Supabase initialization failed, using local mode only:", err);
        }
    }, 100); // Delayed initialization

    // ========== RECORDING FUNCTIONS ==========
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
                if (activeRecorder?.state === 'recording') {
                    activeRecorder.stop();
                    mediaStream?.getTracks().forEach(track => track.stop());
                }

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
                
                startBtn.disabled = true;
                stopBtn.disabled = false;
                status.textContent = 'Recording...';
                
            } catch (err) {
                console.error("Recording error:", err);
                status.textContent = 'Error ❌';
                alert("Microphone access required!");
            }
        }
        else if (stopBtn) {
            if (activeRecorder?.state === 'recording') {
                activeRecorder.stop();
                stopBtn.disabled = true;
                stopBtn.closest('.sentence-card').querySelector('.startBtn').disabled = false;
            }
        }
    });

    // ========== SUBMIT HANDLER ==========
    submitBtn.addEventListener('click', async () => {
        if (!recordings.every(r => r !== null)) {
            alert("Please record all sentences first!");
            return;
        }

        const rollNumber = prompt("Enter your roll number:");
        if (!rollNumber?.trim()) return;

        submitBtn.disabled = true;
        submitBtn.textContent = "Processing...";

        if (supabaseEnabled) {
            try {
                const folderPath = `recordings/${rollNumber}/`;
                
                // Upload recordings
                for (let i = 0; i < recordings.length; i++) {
                    const fileName = `${folderPath}recording_${i+1}.wav`;
                    const { error } = await supabase.storage
                        .from('recordings')
                        .upload(fileName, recordings[i], {
                            contentType: 'audio/wav',
                            upsert: true
                        });
                    
                    if (error) throw error;
                    document.querySelectorAll('.status')[i].textContent = 'Uploaded ✅';
                }
                
                alert("Uploaded to Supabase successfully!");
            } catch (error) {
                console.error("Supabase upload failed:", error);
                saveLocally(recordings, rollNumber);
            }
        } else {
            saveLocally(recordings, rollNumber);
        }
        
        submitBtn.textContent = "Submit All Recordings";
        submitBtn.disabled = false;
    });

    // ========== FALLBACK FUNCTIONS ==========
    function saveLocally(recordings, rollNumber) {
        // Create zip or download files
        recordings.forEach((blob, i) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${rollNumber}_recording_${i+1}.wav`;
            a.click();
        });
        
        alert("Saved recordings locally (Supabase unavailable)");
    }

    function checkCompletion() {
        submitBtn.disabled = !recordings.every(r => r !== null);
    }
});