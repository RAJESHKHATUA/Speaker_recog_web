document.addEventListener('DOMContentLoaded', function () {
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

  // Show User Type Selection
  function showUserTypePopup() {
      userTypePopup.classList.add('active');
      document.body.style.overflow = 'hidden';
  }

  // Login Button - Show User Type Selection
  if (loginBtn) {
      loginBtn.addEventListener('click', function (e) {
          e.preventDefault();
          showUserTypePopup();
      });
  }

  // Signup Link - Switch to Signup Popup
  const signupLink = document.querySelector('.signup-link');
  if (signupLink) {
      signupLink.addEventListener('click', function (e) {
          e.preventDefault();
          loginPopup.classList.remove('active');
          signupPopup.classList.add('active');
      });
  }

  // User Type Selection (Faculty / Student)
  if (facultyBtn && studentBtn) {
      facultyBtn.addEventListener('click', function () {
          document.getElementById('userTypeField').value = 'faculty';
          userTypePopup.classList.remove('active');
          loginPopup.classList.add('active');
          document.querySelector('#loginPopup h2').textContent = 'Faculty Login';
      });

      studentBtn.addEventListener('click', function () {
          document.getElementById('userTypeField').value = 'student';
          userTypePopup.classList.remove('active');
          loginPopup.classList.add('active');
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
      popup.addEventListener('click', function (e) {
          if (e.target === this) {
              closeAllPopups();
          }
      });
  });

  // Close with Escape key
  document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
          closeAllPopups();
      }
  });

  // Close menu when resizing to desktop
  window.addEventListener('resize', function () {
      if (window.innerWidth > 768 && navMenu.classList.contains('show')) {
          toggleMenu();
      }
  });

  // ===== Login Form Validation =====
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
          e.preventDefault(); // Prevent form submission
          
          const username = document.getElementById('loginUsername').value.trim();
          const password = document.getElementById('loginPassword').value.trim();
          const userType = document.getElementById('userTypeField').value; // Get user type

          // Ensures fields are not empty
          if (username === "" || password === "") {
              alert("Username and Password cannot be empty!");
              return;
          }
          const validUsers = {
              "user": "123456",
              "Shyamsunder": "9885433203",
               "Deepak":"deepak",
               "Likith":"Nenerripuk",
               "Rajesh":"Rajesh88"
          };

          if (validUsers[username] && validUsers[username] === password) {
            // Store user type in session
            sessionStorage.setItem('userType', userType);
            sessionStorage.setItem('username', username);
            
            // Redirect based on user type
            if (userType === 'faculty') {
                window.location.href = "manage.html";
            } else if (userType === 'student') {
                window.location.href = "student.html";
            } else {
                // Default redirect for other users
                window.location.href = "student.html";
            }
           
        } else {
            loginError.style.display = "block"; // Show error message
        }
      });
  }
});
