function showScreen(id) {
  document.querySelectorAll(".screen").forEach(el => el.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function goToLogin() { showScreen("login"); }
function goToCreateAccount() { showScreen("register"); }
function goToForgot() { showScreen("forgot"); }

function login() {
  localStorage.setItem("connected", "true");
  checkConnection();
}

function register() {
  localStorage.setItem("connected", "true");
  checkConnection();
}

function logout() {
  localStorage.removeItem("connected");
  checkConnection();
}

function toggleLogout() {
  document.getElementById("logoutModal").classList.toggle("hidden");
}

function checkConnection() {
  const connected = localStorage.getItem("connected") === "true";
  if (connected) {
    document.getElementById("btn-login").classList.add("hidden");
    document.getElementById("btn-creer").classList.add("hidden");
    document.getElementById("btn-mes-histoires").classList.remove("hidden");
    document.getElementById("userMenu").classList.remove("hidden");
  } else {
    document.getElementById("btn-login").classList.remove("hidden");
    document.getElementById("btn-creer").classList.remove("hidden");
    document.getElementById("btn-mes-histoires").classList.add("hidden");
    document.getElementById("userMenu").classList.add("hidden");
  }
  showScreen("accueil");
}