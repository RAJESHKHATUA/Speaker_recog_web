// ================== MAIN APPLICATION CODE ==================
document.addEventListener('DOMContentLoaded', () => {
    // ================== SENTENCES DATA ==================
    const sentences = [
        "Hello, my name is [Name].",
        "I am [Name], present today.",
        "Yes, I am here.",
        "This is [Name] speaking.",
        "[Name] here, marking my attendance.",
        "Present and ready.",
        "Good morning, my name is [Name].",
        "How are you doing today?",
        "It's a great day outside.",
        "Can you hear me clearly?",
        "I love learning new things.",
        "Let's get started with today's class.",
        "This is just a test sentence.",
        "Please repeat that once again.",
        "I hope everyone is doing well.",
        "The quick brown fox jumps over the lazy dog.",
        "I enjoy listening to music in my free time.",
        "Artificial intelligence is changing the world.",
        "A rolling stone gathers no moss.",
        "Technology is advancing at a rapid pace.",
        "Speech recognition is an interesting field of study.",
        "She sells seashells by the seashore.",
        "A journey of a thousand miles begins with a single step.",
        "My phone number is 9876543210.",
        "The time now is 10:30 AM.",
        "Today's date is the 5th of March.",
        "I will be 22 years old next year.",
        "Yes.",
        "No.",
        "Okay.",
        "Hmm.",
        "Alright.",
        "Thank you."
    ];

    // ================== UI SETUP ==================
    const grid = document.getElementById('sentencesGrid');
    grid.innerHTML = ''; // Clear any existing content

    // Create all sentence cards first
    sentences.forEach((text, index) => {
        const card = document.createElement('div');
        card.className = 'sentence-card';
        card.innerHTML = `
            <p class="sentence-text">${text}</p>
            <div class="controls">
                <button class="startBtn" data-index="${index}">🎤 Start</button>
                <button class="stopBtn" data-index="${index}" disabled>⏹️ Stop</button>
                <span class="upload-status"></span>
            </div>
            <audio class="preview" controls hidden></audio>
        `;
        grid.appendChild(card);
    });

    // ================== SUPABASE INITIALIZATION ==================
    const SUPABASE_URL = "https://zbbheudcarcgdgnwrxim.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiYmhldWRjYXJjZ2RnbndyeGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNTc5MzIsImV4cCI6MjA1ODczMzkzMn0.VHW2KYkMB7PtLVNmP9fUDJY0oERCjPEgh8cVtLxljWI";
    const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // ================== RECORDING LOGIC ==================
    let recordings = Array(sentences.length).fill(null);
    let activeRecorder = null;
    let mediaStream = null;

    // Add event listeners to all buttons
    document.querySelectorAll('.startBtn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const index = this.dataset.index;
            const card = this.closest('.sentence-card');
            const stopBtn = card.querySelector('.stopBtn');
            const audioPreview = card.querySelector('.preview');
            const status = card.querySelector('.upload-status');

            try {
                // Stop any existing recording
                if (activeRecorder && activeRecorder.state !== 'inactive') {
                    activeRecorder.stop();
                    if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
                }

                // Start new recording
                mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(mediaStream);
                const chunks = [];

                recorder.ondataavailable = e => chunks.push(e.data);
                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'audio/wav' });
                    recordings[index] = blob;
                    audioPreview.src = URL.createObjectURL(blob);
                    audioPreview.hidden = false;
                    status.textContent = "✅ Recorded";
                    checkCompletion();
                };

                recorder.start();
                activeRecorder = recorder;
                
                // Update UI
                this.disabled = true;
                stopBtn.disabled = false;
                status.textContent = "● Recording...";
            } catch (err) {
                alert("Microphone access required!");
                console.error("Recording error:", err);
            }
        });
    });

    document.querySelectorAll('.stopBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.sentence-card');
            const startBtn = card.querySelector('.startBtn');
            
            if (activeRecorder && activeRecorder.state !== 'inactive') {
                activeRecorder.stop();
                startBtn.disabled = false;
                this.disabled = true;
                
                if (mediaStream) {
                    mediaStream.getTracks().forEach(track => track.stop());
                }
            }
        });
    });

    // ================== SUBMIT HANDLER ==================
    document.getElementById('submitVoice').addEventListener('click', async () => {
        if (!recordings.every(r => r !== null)) {
            alert("Please record all sentences before submitting.");
            return;
        }

        const rollNumber = prompt("Enter your roll number:");
        if (!rollNumber || !rollNumber.trim()) {
            alert("Roll number is required!");
            return;
        }

        const submitBtn = document.getElementById('submitVoice');
        submitBtn.disabled = true;
        submitBtn.textContent = "Uploading...";

        try {
            // Create bucket if it doesn't exist
            const { error: bucketError } = await supabase.storage.createBucket('recordings', { public: true });
            if (bucketError && !bucketError.message.includes('already exists')) throw bucketError;

            // Upload recordings
            for (let i = 0; i < recordings.length; i++) {
                const fileName = `recordings/${rollNumber}/sentence_${i+1}.wav`;
                const { error } = await supabase.storage
                    .from('recordings')
                    .upload(fileName, recordings[i], { contentType: 'audio/wav' });
                
                if (error) throw error;
                
                document.querySelectorAll('.upload-status')[i].textContent = "✅ Uploaded";
            }
            
            alert("All recordings uploaded successfully!");
        } catch (error) {
            console.error("Upload error:", error);
            alert("Upload failed. Please check console for details.");
        } finally {
            submitBtn.textContent = "Submit All Recordings";
            submitBtn.disabled = false;
        }
    });

    // ================== HELPER FUNCTIONS ==================
    function checkCompletion() {
        const complete = recordings.every(r => r !== null);
        document.getElementById('submitVoice').disabled = !complete;
    }
});