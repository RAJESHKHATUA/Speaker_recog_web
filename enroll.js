import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-storage.js";

const storage = window.firebaseStorage; // Access Firebase storage from enroll.html

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
    "Let’s get started with today’s class."
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

// ================== SUBMIT HANDLER (UPLOAD TO FIREBASE) ==================
document.getElementById("submitVoice").addEventListener("click", async () => {
    const rollNumber = prompt("Enter your roll number:");
    if (!rollNumber) return;

    const submitBtn = document.getElementById("submitVoice");
    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading...";

    try {
        const uploadPromises = recordings.map(async (blob, index) => {
            if (!blob) return Promise.resolve();

            const filename = `voice_samples/${rollNumber}_recording${index + 1}.wav`;
            const storageRef = ref(storage, filename);

            try {
                const snapshot = await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(snapshot.ref);
                console.log(`Uploaded: ${filename}, URL: ${downloadURL}`);
                document.querySelectorAll(".upload-status")[index].textContent = "✅ Uploaded";
            } catch (error) {
                console.error(`Error uploading ${filename}:`, error);
            }
        });

        await Promise.all(uploadPromises);
        alert("All recordings saved to Firebase Storage!");
    } catch (error) {
        console.error("Upload failed:", error);
        alert("Upload failed. Check console.");
    } finally {
        submitBtn.textContent = "✅ Uploaded";
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
    console.log("Voice enrollment system ready");
});
