// ================== SUPABASE CONFIGURATION ==================
const SUPABASE_URL = "https://zbbheudcarcgdgnwrxim.supabase.co";  // Replace with actual Supabase URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiYmhldWRjYXJjZ2RnbndyeGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNTc5MzIsImV4cCI6MjA1ODczMzkzMn0.VHW2KYkMB7PtLVNmP9fUDJY0oERCjPEgh8cVtLxljWI";  // Replace with actual Supabase anon key

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

// ================== RECORDING LOGIC ==================
let recordings = Array(sentences.length).fill(null);
let activeRecorder = null;

// Create Sentence Cards
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
    document.getElementById("sentencesGrid").appendChild(card);

    const startBtn = card.querySelector(".startBtn");
    const stopBtn = card.querySelector(".stopBtn");
    const audioPreview = card.querySelector(".preview");
    const status = card.querySelector(".upload-status");

    startBtn.addEventListener("click", async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: "audio/wav" });
                recordings[index] = blob;
                audioPreview.src = URL.createObjectURL(blob);
                audioPreview.hidden = false;
                status.textContent = "✅ Recorded";
                checkCompletion();
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            activeRecorder = recorder;
            startBtn.disabled = true;
            stopBtn.disabled = false;
            status.textContent = "● Recording...";
        } catch (err) {
            alert("Microphone access required!");
        }
    });

    stopBtn.addEventListener("click", () => {
        if (activeRecorder) {
            activeRecorder.stop();
            activeRecorder = null;
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
    });
});

// ================== SUBMIT HANDLER (UPLOAD TO SUPABASE) ==================
document.getElementById("submitVoice").addEventListener("click", async () => {
    const rollNumber = prompt("Enter your roll number:");
    if (!rollNumber) return;

    const submitBtn = document.getElementById("submitVoice");
    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading...";

    try {
        const uploadPromises = recordings.map(async (blob, index) => {
            if (!blob) return Promise.resolve();

            const fileName = `recordings/${rollNumber}/recording${index + 1}.wav`;
            const { data, error } = await supabase.storage
                .from("recordings") // Your Supabase storage bucket name
                .upload(fileName, blob, { contentType: "audio/wav" });

            if (error) throw error;
            document.querySelectorAll(".upload-status")[index].textContent = "✅ Uploaded";
        });

        await Promise.all(uploadPromises);
        alert("All recordings saved to Supabase Storage!");
    } catch (error) {
        console.error("Upload failed:", error);
        alert("Upload failed. Check console.");
    } finally {
        submitBtn.textContent = "✅ Submit Recordings";
        submitBtn.disabled = false;
    }
});

// ================== HELPER FUNCTIONS ==================
function checkCompletion() {
    const complete = recordings.every(r => r !== null);
    document.getElementById("submitVoice").disabled = !complete;
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log("Voice enrollment system ready with Supabase");
});
