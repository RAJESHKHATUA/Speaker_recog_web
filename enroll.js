// ================== CONFIGURATION ==================
const DRIVE_FOLDER_ID = "https://drive.google.com/drive/folders/1TR6jpCe9hFchsU-H8eJBeKoz9Uh_2aez?usp=drive_link"; // Replace with your folder ID
const ACCESS_TOKEN = "ya29.a0AeXRPp56-o1x-mcXSPPg3ih8gVHrIlF6DS8dYyw2J8P7BwgS-YU5JSM5PXDRdcnX2d2xAPIFZhx2lFwnJ9MoWgCrB5B4Bex49Pjsk4oiSIuHF3uTkQMix-X3HadEtA51cDalzo0P5JHQeF4Ky5OjbbZsdFfiGHIa16zhiYVIaCgYKATgSARASFQHGX2MiGS8kepx0Ul2XMFnYtTMWww0175"; // Get this from OAuth Playground

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
    // ... (keep your original sentences array)
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

// ================== DRIVE UPLOAD LOGIC ==================
async function uploadToDrive(blob, fileName) {
    const metadata = {
        name: fileName,
        mimeType: "audio/wav",
        parents: [DRIVE_FOLDER_ID]
    };

    const formData = new FormData();
    formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    formData.append("file", blob);

    try {
        const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${ACCESS_TOKEN}`,
                "Content-Type": "multipart/related"
            },
            body: formData
        });
        
        return await response.json();
    } catch (error) {
        console.error("Upload failed:", error);
        throw error;
    }
}

// ================== SUBMIT HANDLER ==================
document.getElementById("submitVoice").addEventListener("click", async () => {
    const rollNumber = prompt("Enter your roll number:");
    if (!rollNumber) return;

    const submitBtn = document.getElementById("submitVoice");
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving to Drive...";

    try {
        const uploadPromises = recordings.map((blob, index) => {
            if (!blob) return Promise.resolve();
            
            const fileName = `${rollNumber}_${Date.now()}_recording${index + 1}.wav`;
            return uploadToDrive(blob, fileName)
                .then(() => {
                    document.querySelectorAll(".upload-status")[index].textContent = "✅ Uploaded";
                });
        });

        await Promise.all(uploadPromises);
        alert("All recordings saved to Drive!");
    } catch (error) {
        alert("Upload failed. Check console.");
    } finally {
        submitBtn.textContent = "Submit Recordings";
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