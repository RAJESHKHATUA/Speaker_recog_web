// ================== SUPABASE CONFIGURATION ==================
const SUPABASE_URL = "https://zbbheudcarcgdgnwrxim.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiYmhldWRjYXJjZ2RnbndyeGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNTc5MzIsImV4cCI6MjA1ODczMzkzMn0.VHW2KYkMB7PtLVNmP9fUDJY0oERCjPEgh8cVtLxljWI";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// ================== RECORDING LOGIC ==================
let recordings = Array(sentences.length).fill(null);
let activeRecorder = null;
let mediaStream = null;

// Create Sentence Cards
document.addEventListener('DOMContentLoaded', () => {
    const sentencesGrid = document.getElementById("sentencesGrid");
    
    sentences.forEach((text, index) => {
        const card = document.createElement("div");
        card.className = "sentence-card";
        card.innerHTML = `
            <p class="sentence-text">${text}</p>
            <div class="controls">
                <button class="startBtn" data-index="${index}">🎤 Start</button>
                <button class="stopBtn" data-index="${index}" disabled>⏹️ Stop</button>
                <span class="upload-status"></span>
            </div>
            <audio class="preview" controls hidden></audio>
        `;
        sentencesGrid.appendChild(card);

        const startBtn = card.querySelector(".startBtn");
        const stopBtn = card.querySelector(".stopBtn");
        const audioPreview = card.querySelector(".preview");
        const status = card.querySelector(".upload-status");

        startBtn.addEventListener("click", async () => {
            try {
                // Stop any existing recording first
                if (activeRecorder && activeRecorder.state !== 'inactive') {
                    activeRecorder.stop();
                }
                
                // Get new media stream
                mediaStream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        sampleRate: 44100
                    } 
                });
                
                const recorder = new MediaRecorder(mediaStream);
                const chunks = [];

                recorder.ondataavailable = e => chunks.push(e.data);
                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: "audio/wav" });
                    recordings[index] = blob;
                    audioPreview.src = URL.createObjectURL(blob);
                    audioPreview.hidden = false;
                    status.textContent = "✅ Recorded";
                    checkCompletion();
                };

                recorder.start();
                activeRecorder = recorder;
                
                startBtn.disabled = true;
                stopBtn.disabled = false;
                status.textContent = "● Recording...";
                
                // Add visual feedback
                startBtn.classList.add('recording');
                
            } catch (err) {
                console.error("Recording error:", err);
                alert("Microphone access required! Please allow microphone permissions.");
            }
        });

        stopBtn.addEventListener("click", () => {
            if (activeRecorder && activeRecorder.state !== 'inactive') {
                activeRecorder.stop();
                startBtn.disabled = false;
                stopBtn.disabled = true;
                startBtn.classList.remove('recording');
                
                // Stop all tracks in the media stream
                if (mediaStream) {
                    mediaStream.getTracks().forEach(track => track.stop());
                }
            }
        });
    });

    // ================== SUBMIT HANDLER ==================
    document.getElementById("submitVoice").addEventListener("click", async () => {
        const rollNumber = prompt("Enter your roll number (required):");
        if (!rollNumber || !rollNumber.trim()) {
            alert("Roll number is required for submission.");
            return;
        }

        const submitBtn = document.getElementById("submitVoice");
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Uploading <span class='loading'></span>";

        try {
            // First create a folder for the user
            const folderPath = `recordings/${rollNumber.trim()}/`;
            
            // Check if folder exists or create it by uploading a dummy file
            const dummyFile = new Blob([""], { type: "text/plain" });
            await supabase.storage
                .from("recordings")
                .upload(`${folderPath}.keep`, dummyFile, {
                    upsert: true
                });

            // Upload all recordings
            const uploadPromises = recordings.map(async (blob, index) => {
                if (!blob) return;
                
                const fileName = `${folderPath}recording_${index + 1}_${Date.now()}.wav`;
                const { error } = await supabase.storage
                    .from("recordings")
                    .upload(fileName, blob, {
                        contentType: "audio/wav",
                        upsert: false
                    });

                if (error) throw error;
                
                // Update UI status
                document.querySelectorAll(".upload-status")[index].textContent = "✅ Uploaded";
            });

            await Promise.all(uploadPromises);
            alert("All recordings have been successfully uploaded to Supabase!");
            
            // Reset the UI after successful upload
            submitBtn.textContent = "✅ Upload Complete";
            setTimeout(() => {
                submitBtn.textContent = "Submit all Recordings";
                submitBtn.disabled = !recordings.every(r => r !== null);
            }, 3000);
            
        } catch (error) {
            console.error("Upload error:", error);
            submitBtn.innerHTML = "⚠️ Upload Failed";
            alert(`Upload failed: ${error.message}`);
            
            setTimeout(() => {
                submitBtn.textContent = "Submit all Recordings";
                submitBtn.disabled = !recordings.every(r => r !== null);
            }, 2000);
        }
    });
});

// ================== HELPER FUNCTIONS ==================
function checkCompletion() {
    const complete = recordings.every(r => r !== null);
    document.getElementById("submitVoice").disabled = !complete;
}