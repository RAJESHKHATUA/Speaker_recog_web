document.addEventListener('DOMContentLoaded', () => {
    // ================== SENTENCES DATA ==================
    const sentences = [
        "Hello, my name is [Name].",
        "I am [Name], present today.",
        // ... (include all your sentences)
    ];

    // ================== UI SETUP ==================
    const grid = document.getElementById('sentencesGrid');
    const submitBtn = document.getElementById('submitVoice');
    
    // Clear and rebuild grid to ensure no duplicates
    grid.innerHTML = '';
    sentences.forEach((text, index) => {
        const card = document.createElement('div');
        card.className = 'sentence-card';
        card.innerHTML = `
            <p class="sentence-text">${text}</p>
            <div class="controls">
                <button class="startBtn" data-index="${index}">🎤 Start</button>
                <button class="stopBtn" data-index="${index}" disabled>⏹️ Stop</button>
                <span class="status">Not recorded</span>
            </div>
            <audio class="preview" controls hidden></audio>
        `;
        grid.appendChild(card);
    });

    // ================== SUPABASE INIT ==================
    const supabase = supabase.createClient(
        "https://zbbheudcarcgdgnwrxim.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiYmhldWRjYXJjZ2RnbndyeGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNTc5MzIsImV4cCI6MjA1ODczMzkzMn0.VHW2KYkMB7PtLVNmP9fUDJY0oERCjPEgh8cVtLxljWI"
    );

    // ================== RECORDING LOGIC ==================
    let recordings = Array(sentences.length).fill(null);
    let activeRecorder = null;
    let mediaStream = null;

    document.querySelectorAll('.startBtn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const index = parseInt(this.dataset.index);
            const card = this.closest('.sentence-card');
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
                this.disabled = true;
                stopBtn.disabled = false;
                status.textContent = 'Recording...';
                
            } catch (err) {
                console.error("Recording failed:", err);
                status.textContent = 'Recording failed ❌';
                alert("Could not access microphone. Please check permissions.");
            }
        });
    });

    document.querySelectorAll('.stopBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.sentence-card');
            const startBtn = card.querySelector('.startBtn');
            
            if (activeRecorder?.state !== 'inactive') {
                activeRecorder.stop();
                startBtn.disabled = false;
                this.disabled = true;
                mediaStream?.getTracks().forEach(track => track.stop());
            }
        });
    });

    // ================== UPLOAD HANDLER ==================
    submitBtn.addEventListener('click', async () => {
        if (!recordings.every(r => r !== null)) {
            alert("Please record all sentences first!");
            return;
        }

        const rollNumber = prompt("Enter your roll number:");
        if (!rollNumber?.trim()) {
            alert("Roll number is required!");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Uploading...";
        
        try {
            // 1. Ensure bucket exists
            const { error: bucketError } = await supabase.storage
                .createBucket('recordings', { public: true });
            
            if (bucketError && !bucketError.message.includes('already exists')) {
                throw bucketError;
            }

            // 2. Upload each recording
            for (let i = 0; i < recordings.length; i++) {
                const fileName = `recordings/${rollNumber}/sentence_${i+1}.wav`;
                const { error } = await supabase.storage
                    .from('recordings')
                    .upload(fileName, recordings[i], {
                        contentType: 'audio/wav',
                        upsert: true,
                        cacheControl: '3600'
                    });

                if (error) throw error;
                
                document.querySelectorAll('.status')[i].textContent = 'Uploaded ✅';
            }

            alert("All recordings uploaded successfully!");
            
        } catch (error) {
            console.error("Upload error:", error);
            
            // Specific error messages
            if (error.message.includes('The resource already exists')) {
                alert("Files already exist for this roll number!");
            } else if (error.message.includes('JWT expired')) {
                alert("Session expired. Please refresh the page.");
            } else {
                alert(`Upload failed: ${error.message}`);
            }
            
        } finally {
            submitBtn.textContent = "Submit All Recordings";
            submitBtn.disabled = !recordings.every(r => r !== null);
        }
    });

    // ================== HELPER FUNCTIONS ==================
    function checkCompletion() {
        submitBtn.disabled = !recordings.every(r => r !== null);
    }
});