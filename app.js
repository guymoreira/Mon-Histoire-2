// Correction complète JS - 6 mai 2025

document.addEventListener("DOMContentLoaded", () => {
  const createStoryBtn = document.getElementById("create-story-btn");
  const loginBtn = document.getElementById("login-btn");
  const logoutModal = document.getElementById("logout-modal");
  const logoutConfirmBtn = document.getElementById("logout-confirm-btn");

  // Simuler une session persistante
  const userSession = localStorage.getItem("session_active");

  if (userSession) {
    showUserIcon();
  }

  createStoryBtn?.addEventListener("click", () => {
    window.location.href = "formulaire.html";
  });

  loginBtn?.addEventListener("click", () => {
    localStorage.setItem("session_active", "true");
    showUserIcon();
  });

  logoutConfirmBtn?.addEventListener("click", () => {
    localStorage.removeItem("session_active");
    window.location.reload();
  });

  function showUserIcon() {
    loginBtn.style.display = "none";

    const userIcon = document.createElement("div");
    userIcon.id = "user-icon";
    userIcon.textContent = "GM";
    userIcon.classList.add("user-icon");
    document.body.appendChild(userIcon);

    userIcon.addEventListener("click", () => {
      logoutModal.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!logoutModal.contains(e.target) && e.target !== userIcon) {
        logoutModal.classList.add("hidden");
      }
    });
  }
});
