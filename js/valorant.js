/**
 * 瓦罗兰特集锦页：截图图集 + 英雄筛选
 */
(function () {
  'use strict';

  let data = null;
  let activeScreenshotDate = '';

  const videoGrid = document.getElementById('videoGrid');
  const screenshotsGrid = document.getElementById('screenshotsGrid');
  const dateFilterEl = document.getElementById('screenshotDateFilter');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');

  async function init() {
    try {
      const resp = await fetch('data/valorant.json');
      if (!resp.ok) throw new Error('加载失败');
      data = await resp.json();
      renderDateFilters();
      renderVideos();
      renderScreenshots();
    } catch (err) {
      if (videoGrid) videoGrid.innerHTML = `<div class="error">❌ ${err.message}</div>`;
    }
  }

  // === 视频 ===
  function renderVideos() {
    if (!videoGrid) return;
    const videos = data.videos || [];
    if (videos.length === 0) {
      videoGrid.innerHTML = '<div class="empty">暂无视频</div>';
      return;
    }
    videoGrid.innerHTML = videos.map(v => `
      <div class="video-card">
        <div class="video-embed">
          ${v.mp4
            ? `<video src="${v.mp4}" controls muted preload="metadata" playsinline style="width:100%;height:100%;object-fit:cover;"></video>`
            : '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:var(--bg-alt);font-size:3rem;">🎬</div>'}
        </div>
        <div class="video-info">
          <h4>${escapeHTML(v.title)}</h4>
          <div class="video-meta">
            <span>🎯 ${escapeHTML((v.heroes || []).join(' / '))}</span>
            <span>🗺 ${escapeHTML(v.map || '')}</span>
            <span>📅 ${formatDate(v.date)}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // === 截图 ===
  function renderScreenshots() {
    if (!screenshotsGrid) return;
    const screenshots = data.screenshots || [];
    const filtered = activeScreenshotDate
      ? screenshots.filter(s => formatDate(s.date) === activeScreenshotDate)
      : screenshots;

    if (filtered.length === 0) {
      screenshotsGrid.innerHTML = '<div class="empty">无匹配截图</div>';
      return;
    }

    screenshotsGrid.innerHTML = filtered.map((s, i) => {
      const hue = (i * 60 + 10) % 360;
      const imgSrc = s.url || '';
      const placeholder = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 250%22><rect fill=%22hsl(${hue},40%25,20%25)%22 width=%22400%22 height=%22250%22/><text x=%22200%22 y=%22125%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2250%22>🎯</text></svg>`;
      return `
        <div class="screenshot-card" data-screenshot-index="${i}" data-src="screenshot-${i}">
          <img src="${imgSrc || placeholder}" alt="${escapeHTML(s.title)}" loading="lazy" onerror="this.src='${placeholder}'">
          <div class="screenshot-overlay">
            <div class="info">
              <div style="font-weight:600;">${escapeHTML(s.title)}</div>
              <div style="font-size:0.75rem;opacity:0.7;">${formatDate(s.date)} · ${escapeHTML(s.map || '')} · ${escapeHTML(s.type || '')}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // 截图点击放大
    screenshotsGrid.querySelectorAll('.screenshot-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.screenshotIndex);
        openScreenshotLightbox(idx);
      });
    });
  }

  function openScreenshotLightbox(idx) {
    if (!lightbox) return;
    const screenshots = data.screenshots || [];
    const filtered = activeScreenshotDate
      ? screenshots.filter(s => formatDate(s.date) === activeScreenshotDate)
      : screenshots;
    if (idx < 0 || idx >= filtered.length) return;

    const s = filtered[idx];
    const imgSrc = s.url || '';
    const hue = (idx * 60 + 10) % 360;
    const placeholder = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 500%22><rect fill=%22hsl(${hue},40%25,20%25)%22 width=%22800%22 height=%22500%22/><text x=%22400%22 y=%22250%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%22100%22>🎯</text></svg>`;
    lightboxImg.src = imgSrc || placeholder;
    lightboxCaption.textContent = `${s.title} · ${s.type || ''} · ${s.map || ''} · ${formatDate(s.date)}`;
    lightbox.classList.add('open');
  }

  // 灯箱关闭
  document.getElementById('lightboxClose')?.addEventListener('click', () => lightbox?.classList.remove('open'));
  lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('open'); });
  document.addEventListener('keydown', (e) => {
    if (lightbox?.classList.contains('open') && e.key === 'Escape') lightbox.classList.remove('open');
  });

  // 日期筛选
  function renderDateFilters() {
    if (!dateFilterEl) return;
    const screenshots = data.screenshots || [];
    const dates = [...new Set(screenshots.map(s => formatDate(s.date)))].sort((a, b) => b.localeCompare(a));
    dateFilterEl.innerHTML = `
      <button class="category-chip active" data-date="">全部日期</button>
      ${dates.map(d => `<button class="category-chip" data-date="${d}">${d}</button>`).join('')}
    `;
    dateFilterEl.addEventListener('click', (e) => {
      const chip = e.target.closest('.category-chip');
      if (!chip) return;
      dateFilterEl.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeScreenshotDate = chip.dataset.date || '';
      renderScreenshots();
    });
  }

  function formatDate(d) {
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  init();
})();
