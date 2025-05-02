
document.addEventListener('DOMContentLoaded', function () {
  const logoutIcon = document.getElementById('logoutIcon');
  const logoutModal = document.getElementById('logoutModal');
  const confirmLogoutBtn = document.getElementById('confirmLogout');
  const cancelLogoutBtn = document.getElementById('cancelLogout');

  if (logoutIcon && logoutModal) {
    logoutIcon.addEventListener('click', () => {
      logoutModal.classList.remove('hidden');
    });

    confirmLogoutBtn.addEventListener('click', () => {
      logoutModal.classList.add('hidden');
      localStorage.setItem('isLoggedIn', 'false');
      location.reload();
    });

    cancelLogoutBtn.addEventListener('click', () => {
      logoutModal.classList.add('hidden');
    });
  }
});
