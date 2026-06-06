/**
 * 后台管理通用 JS：认证检查 + 消息提示
 */
async function checkAuth() {
  try {
    const resp = await fetch('/api/check-auth');
    const data = await resp.json();
    if (!data.loggedIn) {
      window.location.href = 'login.html';
    }
  } catch (e) {
    window.location.href = 'login.html';
  }
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = 'login.html';
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}
