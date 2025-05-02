
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const myStories = document.getElementById("myStories");

  let isLoggedIn = false;

  function updateUI() {
    if (isLoggedIn) {
      loginBtn.classList.add("hidden");
      logoutBtn.classList.remove("hidden");
      myStories.classList.remove("hidden");
    } else {
      loginBtn.classList.remove("hidden");
      logoutBtn.classList.add("hidden");
      myStories.classList.add("hidden");
    }
  }

  loginBtn.addEventListener("click", () => {
    isLoggedIn = true;
    updateUI();
  });

  logoutBtn.addEventListener("click", () => {
    isLoggedIn = false;
    updateUI();
  });

  updateUI();
});
