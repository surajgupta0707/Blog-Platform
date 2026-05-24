// ===== API URL =====
// This is where all our API requests go
const API_URL = 'http://localhost:5000/api';


// ===== SHOW ERROR MESSAGE =====
// Displays a red error box on the page
function showError(message) {
  const errorAlert = document.getElementById('errorAlert');
  const successAlert = document.getElementById('successAlert');
  errorAlert.textContent = message;
  errorAlert.classList.add('show');
  successAlert.classList.remove('show');
}


// ===== SHOW SUCCESS MESSAGE =====
// Displays a green success box on the page
function showSuccess(message) {
  const successAlert = document.getElementById('successAlert');
  const errorAlert = document.getElementById('errorAlert');
  successAlert.textContent = message;
  successAlert.classList.add('show');
  errorAlert.classList.remove('show');
}


// ===== SET BUTTON LOADING STATE =====
// Shows spinner inside button while waiting for API response
function setLoading(btnId, isLoading) {
  const btn = document.getElementById(btnId);
  if (isLoading) {
    btn.innerHTML = '<span class="spinner"></span> Please wait...';
    btn.disabled = true;
  } else {
    btn.innerHTML = btnId === 'loginBtn' ? 'Sign In' : 'Create Account';
    btn.disabled = false;
  }
}


// ===== SAVE USER DATA =====
// Saves token and user info to localStorage
// localStorage keeps data even after browser is closed
function saveUserData(token, user) {
  localStorage.setItem('blogToken', token);
  localStorage.setItem('blogUser', JSON.stringify(user));
}


// ===== GET TOKEN =====
// Returns saved token from localStorage
function getToken() {
  return localStorage.getItem('blogToken');
}


// ===== GET USER =====
// Returns saved user object from localStorage
function getUser() {
  const user = localStorage.getItem('blogUser');
  return user ? JSON.parse(user) : null;
}


// ===== LOGOUT =====
// Clears saved data and redirects to login
function logout() {
  localStorage.removeItem('blogToken');
  localStorage.removeItem('blogUser');
  window.location.href = 'login.html';
}


// ================================================
// REGISTER FUNCTION
// Called when user clicks "Create Account" button
// ================================================
async function register() {

  // Get values from input fields
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // Check all fields are filled
  if (!name || !email || !password || !confirmPassword) {
    return showError('Please fill in all fields');
  }

  // Check password length
  if (password.length < 6) {
    return showError('Password must be at least 6 characters');
  }

  // Check passwords match
  if (password !== confirmPassword) {
    return showError('Passwords do not match');
  }

  // Show loading spinner
  setLoading('registerBtn', true);

  try {
    // Send POST request to register API
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ name, email, password })
    });

    // Convert response to JSON
    const data = await response.json();

    if (data.success) {
      // Save token and user to localStorage
      saveUserData(data.token, data.user);
      showSuccess('Account created! Redirecting...');

      // Redirect to home page after 1.5 seconds
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 1500);

    } else {
      // Show error from API
      showError(data.message || 'Registration failed');
    }

  } catch (error) {
    showError('Cannot connect to server. Make sure backend is running!');
  } finally {
    // Always remove loading spinner
    setLoading('registerBtn', false);
  }
}


// ================================================
// LOGIN FUNCTION
// Called when user clicks "Sign In" button
// ================================================
async function login() {

  // Get values from input fields
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // Check fields are filled
  if (!email || !password) {
    return showError('Please fill in all fields');
  }

  // Show loading spinner
  setLoading('loginBtn', true);

  try {
    // Send POST request to login API
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ email, password })
    });

    // Convert response to JSON
    const data = await response.json();

    if (data.success) {
      // Save token and user to localStorage
      saveUserData(data.token, data.user);
      showSuccess('Login successful! Redirecting...');

      // Redirect to home page after 1.5 seconds
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 1500);

    } else {
      showError(data.message || 'Login failed');
    }

  } catch (error) {
    showError('Cannot connect to server. Make sure backend is running!');
  } finally {
    setLoading('loginBtn', false);
  }
}


// ===== PRESS ENTER KEY TO SUBMIT =====
// So user doesn't have to click button
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    if (loginBtn) login();
    if (registerBtn) register();
  }
});