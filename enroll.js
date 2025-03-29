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
    
    // Clear and rebuild grid
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

    // Event delegation for reliable button handling
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

    // ================== SUPABASE UPLOAD ==================
    const supabase = supabase.createClient(
        "https://zbbheudcarcgdgnwrxim.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiYmhldWRjYXJjZ2RnbndyeGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNTc5MzIsImV4cCI6MjA1ODczMzkzMn0.VHW2KYkMB7PtLVNmP9fUDJY0oERCjPEgh8cVtLxljWI"
    );

    submitBtn.addEventListener('click', async () => {
        console.log("Submit button clicked"); // Debug log
        
        // Verify all recordings exist
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
            console.log("Attempting to create bucket..."); // Debug log
            
            // 1. Ensure bucket exists
            const { error: bucketError } = await supabase.storage
                .createBucket('recordings', { public: true });
            
            if (bucketError && !bucketError.message.includes('already exists')) {
                throw bucketError;
            }

            console.log("Bucket ready, starting uploads..."); // Debug log
            
            // 2. Upload each recording
            for (let i = 0; i < recordings.length; i++) {
                console.log(`Uploading recording ${i+1}...`); // Debug log
                
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
            console.error("Upload error details:", {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
            
            let errorMessage = "Upload failed. Please try again.";
            if (error.message.includes('JWT expired')) {
                errorMessage = "Session expired. Please refresh the page.";
            } else if (error.message.includes('already exists')) {
                errorMessage = "Recordings for this roll number already exist.";
            }
            
            alert(errorMessage);
        } finally {
            submitBtn.textContent = "Submit All Recordings";
            submitBtn.disabled = !recordings.every(r => r !== null);
        }
    });

    function checkCompletion() {
        const allRecorded = recordings.every(r => r !== null);
        console.log("Check completion:", { allRecorded, recordings }); // Debug log
        submitBtn.disabled = !allRecorded;
    }
});