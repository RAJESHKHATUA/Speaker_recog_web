document.addEventListener('DOMContentLoaded', function() {
    // Add active user indicator
    const userType = localStorage.getItem('userType') || 'student';
    const header = document.querySelector('.dashboard-header');
    
    if (header) {
        header.innerHTML += `
            <p>Logged in as ${userType.charAt(0).toUpperCase() + userType.slice(1)}</p>
            <button id="logoutBtn" class="logout-btn">Logout</button>
        `;
    }

    // Logout functionality
    document.getElementById('logoutBtn')?.addEventListener('click', function() {
        localStorage.removeItem('userType');
        window.location.href = 'index.html';
    });

    // Animation on card hover
    const cards = document.querySelectorAll('.option-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
});