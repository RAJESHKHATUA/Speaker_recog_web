// ================== GOOGLE DRIVE AUTHENTICATION ==================

// Replace with your Google API credentials
const CLIENT_ID = "961655146073-qeh6gs3va79snri2up74gdm8775o3m46.apps.googleusercontent.com";  // Replace this
const API_KEY = "AIzaSyC7ZeVGhMnW_dzmCVUPFrDJRT7T87luEEA";  // Replace this
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/drive.file";

function handleClientLoad() {
    gapi.load("client:auth2", initClient);
}

function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(() => {
        console.log("Google API initialized.");
    }).catch((error) => {
        console.error("Google API initialization failed:", error);
    });
}

function authenticate() {
    return gapi.auth2.getAuthInstance().signIn().then(() => {
        console.log("User signed in");
    }).catch((error) => {
        console.error("Authentication error:", error);
    });
}

async function uploadToDrive(blob, fileName) {
    try {
        await authenticate();
        const accessToken = gapi.auth.getToken().access_token;

        const metadata = {
            name: fileName,
            mimeType: "audio/wav",
            parents: ["YOUR_FOLDER_ID"] // Replace with your Google Drive Folder ID
        };

        const formData = new FormData();
        formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
        formData.append("file", blob);

        const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
            method: "POST",
            headers: new Headers({ Authorization: "Bearer " + accessToken }),
            body: formData
        });

        const data = await response.json();
        console.log("Uploaded file ID:", data.id);
    } catch (error) {
        console.error("Error uploading file:", error);
    }
}

function getRollNumber() {
    return prompt("Enter your Roll Number:");
}

// ================== SENTENCES DATA & RECORDING ==================
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

// Recording State
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
        </div>
        <audio class="preview" controls hidden></audio>
    `;
    document.getElementById("sentencesGrid").appendChild(card);

    // Elements
    const startBtn = card.querySelector(".startBtn");
    const stopBtn = card.querySelector(".stopBtn");
    const audioPreview = card.querySelector(".preview");

    // Recording Handlers
    startBtn.addEventListener("click", async () => {
        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: "audio/wav" });
                recordings[index] = blob;
                audioPreview.src = URL.createObjectURL(blob);
                audioPreview.hidden = false;
                checkCompletion();
            };

            recorder.start();
            activeRecorder = recorder;
            startBtn.disabled = true;
            stopBtn.disabled = false;
            startBtn.classList.add("recording");
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access is required for recording. Please allow permission.");
        }
    });

    stopBtn.addEventListener("click", () => {
        if (activeRecorder) {
            activeRecorder.stop();
            activeRecorder = null;
            startBtn.disabled = false;
            stopBtn.disabled = true;
            startBtn.classList.remove("recording");
        }
    });
});

// Check Completion
function checkCompletion() {
    const complete = recordings.every((r) => r !== null);
    document.getElementById("submitVoice").disabled = !complete;
}

// Submit Handler - Upload to Google Drive
document.getElementById("submitVoice").addEventListener("click", async () => {
    const rollNumber = getRollNumber();
    if (!rollNumber) {
        alert("Roll Number is required!");
        return;
    }

    for (let i = 0; i < recordings.length; i++) {
        if (recordings[i]) {
            const fileName = `${rollNumber}_Recording_${i + 1}.wav`;
            await uploadToDrive(recordings[i], fileName);
        }
    }

    alert("All recordings uploaded successfully!");
});

// Initialize Google API when page loads
handleClientLoad();
