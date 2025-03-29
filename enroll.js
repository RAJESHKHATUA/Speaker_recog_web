document.addEventListener('DOMContentLoaded', () => {
    // ===== CONFIGURATION =====
    const sentences = [
        "Hello, my name is [Name].",
        "I am [Name], present today.",
        "Yes, I am here.",
        "This is [Name] speaking.",
        "[Name] here, marking my attendance."
    ];

    // ===== ELEMENTS =====
    const grid = document.getElementById('sentencesGrid');
    const submitBtn = document.getElementById('submitVoice');
    
    // ===== STATE =====
    let recordings = Array(sentences.length).fill(null);
    let activeRecorder = null;
    let mediaStream = null;
    
    const supabase = supabase.createClient(
        "https://zbbheudcarcgdgnwrxim.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiYmhldWRjYXJjZ2RnbndyeGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNTc5MzIsImV4cCI6MjA1ODczMzkzMn0.VHW2KYkMB7PtLVNmP9fUDJY0oERCjPEgh8cVtLxljWI"
    );

    // ===== INITIALIZE UI =====
    function createSentenceCards() {
        // Clear existing cards
        grid.innerHTML = '';
        
        // Create new cards
        sentences.forEach((text, index) => {
            const card = document.createElement('div');
            card.className = 'sentence-card';
            card.innerHTML = `
                <p>${text}</p>
                <div class="controls">
                    <button class="startBtn" data-index="${index}">🎤 Start</button>
                    <button class="stopBtn" data-index="${index}" disabled>⏹️ Stop</button>
                    <span class="status">Not recorded</span>
                </div>
                <audio class="preview" controls hidden></audio>
            `;
            grid.appendChild(card);
        });
    }

    // ===== RECORDING FUNCTIONS =====
    function setupRecordingListeners() {
        grid.addEventListener('click', (e) => {
            const startBtn = e.target.closest('.startBtn');
            const stopBtn = e.target.closest('.stopBtn');
            
            if (startBtn) {
                const index = parseInt(startBtn.dataset.index);
                startRecording(index);
            } else if (stopBtn) {
                const index = parseInt(stopBtn.dataset.index);
                stopRecording(index);
            }
        });
    }

    async function startRecording(index) {
        try {
            // Stop any existing recording
            if (activeRecorder?.state === 'recording') {
                activeRecorder.stop();
                mediaStream?.getTracks().forEach(track => track.stop());
            }

            // Start new recording
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(mediaStream);
            const chunks = [];
            
            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = () => {
                recordings[index] = new Blob(chunks, { type: 'audio/wav' });
                const audioElement = document.querySelectorAll('.preview')[index];
                audioElement.src = URL.createObjectURL(recordings[index]);
                audioElement.hidden = false;
                updateStatus(index, 'Recorded ✅');
                checkCompletion();
            };

            recorder.start();
            activeRecorder = recorder;
            
            // Update UI
            document.querySelectorAll('.startBtn')[index].disabled = true;
            document.querySelectorAll('.stopBtn')[index].disabled = false;
            updateStatus(index, 'Recording...');
            
        } catch (error) {
            console.error('Recording error:', error);
            updateStatus(index, 'Error ❌');
            alert('Microphone access required!');
        }
    }

    function stopRecording(index) {
        if (activeRecorder?.state === 'recording') {
            activeRecorder.stop();
            document.querySelectorAll('.startBtn')[index].disabled = false;
            document.querySelectorAll('.stopBtn')[index].disabled = true;
        }
    }

    // ===== UPLOAD FUNCTIONS =====
    async function handleSubmit() {
        // Validate all recordings exist
        if (!recordings.every(r => r !== null)) {
            alert('Please record all sentences first!');
            return;
        }

        const rollNumber = prompt('Enter your roll number:');
        if (!rollNumber?.trim()) {
            alert('Roll number is required!');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';

        try {
            // Ensure bucket exists
            const { error: bucketError } = await supabase.storage
                .createBucket('recordings', { public: true });
            
            if (bucketError && !bucketError.message.includes('already exists')) {
                throw bucketError;
            }

            // Upload recordings
            for (let i = 0; i < recordings.length; i++) {
                const fileName = `recordings/${rollNumber}/sentence_${i+1}.wav`;
                const { error } = await supabase.storage
                    .from('recordings')
                    .upload(fileName, recordings[i], {
                        contentType: 'audio/wav',
                        upsert: true
                    });

                if (error) throw error;
                
                updateStatus(i, 'Uploaded ✅');
            }

            alert('All recordings uploaded successfully!');
        } catch (error) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            submitBtn.textContent = 'Submit All Recordings';
            submitBtn.disabled = false;
        }
    }

    // ===== HELPER FUNCTIONS =====
    function updateStatus(index, message) {
        document.querySelectorAll('.status')[index].textContent = message;
    }

    function checkCompletion() {
        submitBtn.disabled = !recordings.every(r => r !== null);
    }

    // ===== INITIALIZE APP =====
    createSentenceCards();
    setupRecordingListeners();
    submitBtn.addEventListener('click', handleSubmit);
});