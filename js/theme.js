/**
 * 主题切换 + 移动端导航
 */
(function () {
  'use strict';

  // === 主题切换 ===
  const html = document.documentElement;
  const STORAGE_KEY = 'hhhpf-space-theme';

  function getTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // 默认暗色电竞风
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      html.classList.add('light-mode');
    } else {
      html.classList.remove('light-mode');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function toggleTheme() {
    const current = html.classList.contains('light-mode') ? 'light' : 'dark';
    applyTheme(current === 'light' ? 'dark' : 'light');
  }

  applyTheme(getTheme());

  const themeBtn = document.getElementById('themeToggle');
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
    // 点击链接后关闭
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }
})();
