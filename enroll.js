document.addEventListener('DOMContentLoaded', () => {
    // ===== CONFIGURATION =====
    const SUPABASE_URL = "https://zbbheudcarcgdgnwrxim.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiYmhldWRjYXJjZ2RnbndyeGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNTc5MzIsImV4cCI6MjA1ODczMzkzMn0.VHW2KYkMB7PtLVNmP9fUDJY0oERCjPEgh8cVtLxljWI";
    
    // ===== ELEMENTS =====
    const grid = document.getElementById('sentencesGrid');
    const submitBtn = document.getElementById('submitVoice');
    
    // ===== SENTENCES =====
    const sentences = [
        "Hello, my name is [Name].",
        "I am [Name], present today.",
        "Yes, I am here.",
        "This is [Name] speaking.",
        "[Name] here, marking my attendance."
    ];

    // ===== STATE =====
    let recordings = Array(sentences.length).fill(null);
    let activeRecorder = null;
    let mediaStream = null;
    const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // ===== INITIALIZE UI =====
    function initializeUI() {
        grid.innerHTML = '';
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
    async function startRecording(index) {
        try {
            // Stop any existing recording
            if (activeRecorder?.state === 'recording') {
                activeRecorder.stop();
                mediaStream?.getTracks().forEach(track => track.stop());
            }

            // Get media stream
            mediaStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                } 
            });

            // Setup recorder
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

            // Start recording
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
            mediaStream?.getTracks().forEach(track => track.stop());
        }
    }

    // ===== UPLOAD FUNCTIONS =====
    async function handleSubmit() {
        console.log('Submit initiated');
        
        // Validate recordings
        if (!recordings.every(r => r !== null)) {
            alert('Please record all sentences first!');
            return;
        }

        const rollNumber = prompt('Enter your roll number:');
        if (!rollNumber?.trim()) {
            alert('Roll number is required!');
            return;
        }

        // Update UI
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';

        try {
            console.log('Starting upload process...');
            
            // 1. Ensure bucket exists
            const { error: bucketError } = await supabase.storage
                .createBucket('recordings', { public: true });
            
            if (bucketError && !bucketError.message.includes('already exists')) {
                throw bucketError;
            }

            // 2. Upload files
            for (let i = 0; i < recordings.length; i++) {
                console.log(`Uploading recording ${i+1}...`);
                const fileName = `recordings/${rollNumber}/sentence_${i+1}.wav`;
                
                const { error } = await supabase.storage
                    .from('recordings')
                    .upload(fileName, recordings[i], {
                        contentType: 'audio/wav',
                        upsert: true,
                        cacheControl: '3600'
                    });

                if (error) throw error;
                
                updateStatus(i, 'Uploaded ✅');
            }

            alert('All recordings uploaded successfully!');
        } catch (error) {
            console.error('Upload failed:', error);
            alert(`Upload error: ${error.message}`);
        } finally {
            submitBtn.textContent = 'Submit All Recordings';
            submitBtn.disabled = !recordings.every(r => r !== null);
        }
    }

    // ===== HELPER FUNCTIONS =====
    function updateStatus(index, message) {
        document.querySelectorAll('.status')[index].textContent = message;
    }

    function checkCompletion() {
        submitBtn.disabled = !recordings.every(r => r !== null);
    }

    // ===== EVENT LISTENERS =====
    function setupEventListeners() {
        // Recording controls
        grid.addEventListener('click', (e) => {
            const startBtn = e.target.closest('.startBtn');
            const stopBtn = e.target.closest('.stopBtn');
            
            if (startBtn) {
                startRecording(parseInt(startBtn.dataset.index));
            } else if (stopBtn) {
                stopRecording(parseInt(stopBtn.dataset.index));
            }
        });

        // Submit button
        submitBtn.addEventListener('click', handleSubmit);
    }

    // ===== INITIALIZE APP =====
    initializeUI();
    setupEventListeners();
});