document.addEventListener('DOMContentLoaded', function() {
  // ===== Mobile Menu Toggle =====
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-links');
  
  function toggleMenu() {
    navMenu.classList.toggle('show');
    document.body.classList.toggle('no-scroll');
  }
  
  if (hamburger) {
    hamburger.addEventListener('click', toggleMenu);
  }

  // Close menu when clicking links
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('show');
      document.body.classList.remove('no-scroll');
    });
  });

  // ===== Popup Logic =====
  const loginBtn = document.querySelector('.login-button');
  const signupBtn = document.querySelector('.signup-button');
  const userTypePopup = document.getElementById('userTypePopup');
  const loginPopup = document.getElementById('loginPopup');
  const signupPopup = document.getElementById('signupPopup');
  const facultyBtn = document.getElementById('facultyLoginBtn');
  const studentBtn = document.getElementById('studentLoginBtn');
  const closeBtns = document.querySelectorAll('.close-btn');

  // Add this to your existing JS
const mobileLoginBtn = document.getElementById('mobileLoginBtn');

if (mobileLoginBtn) {
  mobileLoginBtn.addEventListener('click', function(e) {
    e.preventDefault();
    showUserTypePopup(); // Reuse the same popup function
  });
}
  // Show User Type Selection
  function showUserTypePopup() {
    userTypePopup.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Login Button - Show User Type Selection
  if (loginBtn) {
    loginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      showUserTypePopup();
    });
  }

// Add this with your other event listeners
const signupLink = document.querySelector('.signup-link');

if (signupLink) {
  signupLink.addEventListener('click', function(e) {
    e.preventDefault();
    loginPopup.classList.remove('active');
    signupPopup.classList.add('active');
    
    // Optional: Smooth transition between popups
    setTimeout(() => {
      signupPopup.querySelector('input').focus();
    }, 300);
  });
}
// Find this section in your existing code (~line 30-50)
if (facultyBtn && studentBtn) {
  facultyBtn.addEventListener('click', function() {
    // Set user type to faculty
    document.getElementById('userTypeField').value = 'faculty';
    
    userTypePopup.classList.remove('active');
    loginPopup.classList.add('active');
    
    // Optional: Change login title
    document.querySelector('#loginPopup h2').textContent = 'Faculty Login';
  });

  studentBtn.addEventListener('click', function() {
    // Set user type to student
    document.getElementById('userTypeField').value = 'student';
    
    userTypePopup.classList.remove('active');
    loginPopup.classList.add('active');
    
    // Optional: Change login title
    document.querySelector('#loginPopup h2').textContent = 'Student Login';
  });
}

  // Close All Popups
  function closeAllPopups() {
    userTypePopup.classList.remove('active');
    loginPopup.classList.remove('active');
    signupPopup.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  // Close buttons
  closeBtns.forEach(btn => {
    btn.addEventListener('click', closeAllPopups);
  });

  // Close when clicking outside
  [userTypePopup, loginPopup, signupPopup].forEach(popup => {
    popup.addEventListener('click', function(e) {
      if (e.target === this) {
        closeAllPopups();
      }
    });
  });

  // Close with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeAllPopups();
    }
  });

  // Close menu when resizing to desktop
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768 && navMenu.classList.contains('show')) {
      toggleMenu();
    }
  });
});