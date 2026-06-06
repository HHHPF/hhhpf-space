/**
 * 主题切换 + 移动端导航
 */
(function () {
  'use strict';

  // === 主题切换 ===
  const html = document.documentElement;
  const STORAGE_KEY = 'hhhpf-space-theme';
  const themeBtn = document.getElementById('themeToggle');

  function getTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // 默认暗色
  }

  function updateToggleIcon(theme) {
    if (!themeBtn) return;
    themeBtn.textContent = theme === 'light' ? '☽' : '☀';
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      html.classList.add('light-mode');
    } else {
      html.classList.remove('light-mode');
    }
    localStorage.setItem(STORAGE_KEY, theme);
    updateToggleIcon(theme);
  }

  function toggleTheme() {
    const current = html.classList.contains('light-mode') ? 'light' : 'dark';
    applyTheme(current === 'light' ? 'dark' : 'light');
  }

  applyTheme(getTheme());

  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  // === 移动端汉堡菜单 ===
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }
})();
