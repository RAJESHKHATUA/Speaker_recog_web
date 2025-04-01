class AudioRecorder {
    constructor() {
        this.recordings = [];
        this.mediaStream = null;
        this.activeRecorder = null;
        this.sentences = [
            "Hello, my name is [Name].",
            "I am [Name], present today.",
            "Yes, I am here.",
            "This is [Name] speaking.",
            "[Name] here, marking my attendance.",
            "Present and ready.",
            "Good morning, my name is [Name].",
            "How are you doing today?",
            "It’s a great day outside.",
            "Can you hear me clearly?",
            "I love learning new things.",
            "Let’s get started with today’s class.",
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
            "Today’s date is the 5th of March.",
            "I will be 22 years old next year.",
            "Yes.",
            "No.",
            "Okay.",
            "Hmm.",
            "Alright.",
            "Thank you."
        ];
        
        this.initUI();
        this.bindEvents();
    }

    initUI() {
        const grid = document.getElementById('sentencesGrid');
        grid.innerHTML = this.sentences.map((text, index) => `
            <div class="sentence-card" data-index="${index}">
                <p>${text}</p>
                <div class="controls">
                    <button class="startBtn">🎤 Record</button>
                    <button class="stopBtn" disabled>⏹️ Stop</button>
                    <span class="status">Ready</span>
                </div>
                <audio class="preview" controls hidden></audio>
                <div class="progress-bar"></div>
            </div>
        `).join('');
    }

    async startRecording(index) {
        const card = document.querySelector(`.sentence-card[data-index="${index}"]`);
        
        try {
            // Stop any existing recording
            if (this.activeRecorder?.state === 'recording') {
                this.stopRecording();
            }

            // Get microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });

            this.activeRecorder = new MediaRecorder(this.mediaStream);
            const chunks = [];

            this.activeRecorder.ondataavailable = e => chunks.push(e.data);
            this.activeRecorder.onstop = () => {
                this.recordings[index] = new Blob(chunks, { type: 'audio/wav' });
                const audioURL = URL.createObjectURL(this.recordings[index]);
                card.querySelector('.preview').src = audioURL;
                card.querySelector('.preview').hidden = false;
                card.querySelector('.status').textContent = 'Recorded ✅';
                this.checkCompletion();
            };

            this.activeRecorder.start(100);
            
            // Update UI
            card.querySelector('.startBtn').disabled = true;
            card.querySelector('.stopBtn').disabled = false;
            card.querySelector('.status').textContent = 'Recording...';
            
        } catch (error) {
            console.error("Recording error:", error);
            card.querySelector('.status').textContent = 'Error ❌';
            if (error.name === 'NotAllowedError') {
                alert("Microphone access is required for voice enrollment.");
            }
        }
    }

    stopRecording() {
        if (this.activeRecorder?.state === 'recording') {
            this.activeRecorder.stop();
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
    }

    async uploadRecordings() {
        const userID = prompt("Enter your enrollment ID:");
        if (!userID?.trim()) return;

        const submitBtn = document.getElementById('submitVoice');
        submitBtn.disabled = true;
        submitBtn.textContent = "Uploading...";

        try {
            // Create user directory
            const folderPath = `enrollments/${userID.trim()}/`;
            
            // Upload all recordings
            for (let i = 0; i < this.recordings.length; i++) {
                if (!this.recordings[i]) continue;

                const card = document.querySelector(`.sentence-card[data-index="${i}"]`);
                const progressBar = card.querySelector('.progress-bar');
                const fileName = `${folderPath}phrase_${i+1}.wav`;

                // Upload with error handling
                const { error } = await supabase.storage
                    .from(bucketName)
                    .upload(fileName, this.recordings[i], {
                        contentType: 'audio/wav',
                        cacheControl: '3600'
                    });

                if (error) throw error;

                // Update progress UI
                progressBar.style.width = '100%';
                progressBar.style.backgroundColor = '#2ecc71';
                card.querySelector('.status').textContent = 'Uploaded ✅';
            }

            alert("Voice enrollment completed successfully!");
        } catch (error) {
            console.error("Upload failed:", error);
            this.saveLocally(userID);
        } finally {
            submitBtn.textContent = "Submit Recordings";
            submitBtn.disabled = false;
        }
    }

    saveLocally(userID) {
        this.recordings.forEach((blob, i) => {
            if (!blob) return;
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${userID}_phrase_${i+1}.wav`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        });
        alert("Recordings saved locally!");
    }

    checkCompletion() {
        const completed = this.recordings.filter(Boolean).length === this.sentences.length;
        document.getElementById('submitVoice').disabled = !completed;
    }

    bindEvents() {
        document.getElementById('sentencesGrid').addEventListener('click', (e) => {
            const card = e.target.closest('.sentence-card');
            if (!card) return;
            
            const index = parseInt(card.dataset.index);
            
            if (e.target.classList.contains('startBtn')) {
                this.startRecording(index);
            } 
            else if (e.target.classList.contains('stopBtn')) {
                this.stopRecording();
                card.querySelector('.startBtn').disabled = false;
                card.querySelector('.stopBtn').disabled = true;
            }
        });

        document.getElementById('submitVoice').addEventListener('click', () => {
            this.uploadRecordings();
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AudioRecorder();
});