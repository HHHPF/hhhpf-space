/**
 * 动态导航 + 站点设置
 * 从 data/settings.json 加载，更新导航栏、卡片、关于我页面、页脚
 */
(function () {
  'use strict';

  async function init() {
    try {
      const resp = await fetch('data/settings.json');
      if (!resp.ok) return;
      const settings = await resp.json();

      updateNav(settings);
      updateCards(settings);
      updateAbout(settings);
      updateFooter(settings);
    } catch (e) {
      // settings.json 不存在或加载失败，使用页面默认值
    }
  }

  function updateNav(settings) {
    const navLinks = document.querySelectorAll('.nav-links a[data-section]');
    const sec = settings.sections || {};
    navLinks.forEach(link => {
      const key = link.dataset.section;
      if (sec[key] && sec[key].name) {
        link.textContent = sec[key].name;
      }
    });
    // 站点名称
    const logo = document.querySelector('.logo');
    if (logo && settings.siteName) {
      // logo 结构: <span class="dot"></span> HHHPf's Space
      const span = logo.querySelector('.dot');
      if (span) {
        logo.childNodes.forEach(node => {
          if (node.nodeType === 3 && node.textContent.trim()) {
            node.textContent = ' ' + settings.siteName;
          }
        });
      }
    }
  }

  function updateCards(settings) {
    const cards = document.querySelectorAll('.quick-card[data-section]');
    const sec = settings.sections || {};
    cards.forEach(card => {
      const key = card.dataset.section;
      const cfg = sec[key];
      if (!cfg) return;
      const h3 = card.querySelector('h3');
      const p = card.querySelector('p');
      if (h3 && cfg.cardTitle) h3.textContent = cfg.cardTitle;
      if (p && cfg.cardDesc) p.textContent = cfg.cardDesc;
      // 更新卡片图标
      const emoji = card.querySelector('.card-img');
      if (emoji && cfg.emoji) {
        emoji.style.fontSize = '4rem';
        emoji.textContent = cfg.emoji;
      }
    });
  }

  function updateAbout(settings) {
    const container = document.querySelector('.about-container');
    if (!container) return; // 不是关于页面
    const about = settings.about;
    if (!about) return;

    const title = container.querySelector('h1');
    const profile = container.querySelector('.about-profile');
    const avatar = container.querySelector('.about-avatar');
    const info = container.querySelector('.about-info');
    const sectionsContainer = container;

    // 标题
    if (title) title.textContent = about.name ? about.name.replace('你好，我是 ', '') : '关于我';

    // 头像和介绍
    if (avatar && about.avatar) avatar.textContent = about.avatar;
    if (info && profile) {
      const h2 = info.querySelector('h2');
      const p = info.querySelector('p');
      if (h2 && about.name) h2.textContent = about.name;
      if (p && about.subtitle) p.textContent = about.subtitle;
    }

    // 动态渲染关于区块
    if (about.sections && about.sections.length > 0) {
      // 删除旧的静态 sections
      const oldSections = sectionsContainer.querySelectorAll('.about-section');
      oldSections.forEach(s => s.remove());

      // 在 profile 后面插入新 sections
      const insertAfter = profile || title;
      about.sections.forEach(sec => {
        const div = document.createElement('div');
        div.className = 'about-section';
        div.innerHTML = `<h3>${escapeHTML(sec.title)}</h3>${formatContent(sec.content)}`;
        insertAfter.insertAdjacentElement('afterend', div);
      });
    }
  }

  function updateFooter(settings) {
    const footer = document.querySelector('.footer p');
    if (footer && settings.siteName) {
      footer.innerHTML = footer.innerHTML.replace(/HHHPf's Space/g, escapeHTML(settings.siteName));
    }
  }

  function formatContent(text) {
    if (!text) return '';
    // 换行 → <p>，保留已有 HTML 标签
    return text.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      // 如果已经是 HTML 格式（包含链接等）
      if (trimmed.startsWith('📧') || trimmed.startsWith('🐱') || trimmed.startsWith('🎮')) {
        return `<p>${trimmed}</p>`;
      }
      return `<p>${trimmed}</p>`;
    }).join('');
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  init();
})();
