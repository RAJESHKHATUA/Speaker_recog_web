// Forgot Password Form Submission
document.getElementById("forgotPasswordForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;

    // Simulate sending a reset link
    if (email) {
        alert(`A password reset link has been sent to ${email}.`);
    } else {
        alert("Please enter a valid email address.");
    }
});