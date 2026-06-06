/**
 * 作者帅气自拍：瀑布流布局 + 分组/年份筛选 + 灯箱弹窗
 */
(function () {
  'use strict';

  let allPhotos = [];
  let activeGroup = '';
  let activeYear = '';
  let lightboxIndex = -1;
  let currentFiltered = [];

  const gridEl = document.getElementById('masonryGrid');
  const groupFilterEl = document.getElementById('galleryFilters');
  const yearFilterEl = document.getElementById('yearFilters');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');

  async function init() {
    try {
      const resp = await fetch('data/gallery.json');
      if (!resp.ok) throw new Error('加载失败');
      allPhotos = await resp.json();
      allPhotos.sort((a, b) => new Date(b.date) - new Date(a.date));
      renderYearFilters();
      renderGrid();
    } catch (err) {
      if (gridEl) gridEl.innerHTML = `<div class="error">❌ ${err.message}</div>`;
    }
  }

  function renderYearFilters() {
    if (!yearFilterEl) return;
    const years = [...new Set(allPhotos.map(p => new Date(p.date).getFullYear()))].sort((a, b) => b - a);
    yearFilterEl.innerHTML = `
      <button class="category-chip active" data-year="">全部年份</button>
      ${years.map(y => `<button class="category-chip" data-year="${y}">${y}年</button>`).join('')}
    `;
  }

  function getFiltered() {
    return allPhotos.filter(p => {
      if (activeGroup && p.group !== activeGroup) return false;
      if (activeYear && new Date(p.date).getFullYear() !== parseInt(activeYear)) return false;
      return true;
    });
  }

  function renderGrid() {
    if (!gridEl) return;
    currentFiltered = getFiltered();

    if (currentFiltered.length === 0) {
      gridEl.innerHTML = '<div class="empty">📭 该筛选条件下暂无照片</div>';
      return;
    }

    gridEl.innerHTML = currentFiltered.map((p, i) => {
      const imgSrc = p.url || p.file || '';
      const hue = (i * 47) % 360;
      const placeholder = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22><rect fill=%22hsl(${hue},15%25,30%25)%22 width=%22400%22 height=%22400%22/><text x=%22200%22 y=%22200%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2260%22>📷</text></svg>`;
      const aspectClass = i % 3 === 0 ? 'tall' : i % 3 === 1 ? 'wide' : 'square';
      return `
        <div class="masonry-item ${aspectClass}" data-index="${i}" title="${escapeHTML(p.title)}">
          <img src="${imgSrc || placeholder}" alt="${escapeHTML(p.title)}" loading="lazy" onerror="this.src='${placeholder}'">
          <div class="overlay"><span>${escapeHTML(p.title)} · ${escapeHTML(p.group || '')}</span></div>
        </div>
      `;
    }).join('');

    // 点击打开灯箱
    gridEl.querySelectorAll('.masonry-item').forEach(item => {
      item.addEventListener('click', () => {
        lightboxIndex = parseInt(item.dataset.index);
        openLightbox();
      });
    });
  }

  function openLightbox() {
    if (!lightbox || lightboxIndex < 0 || lightboxIndex >= currentFiltered.length) return;
    const photo = currentFiltered[lightboxIndex];
    const imgSrc = photo.url || photo.file || '';
    const i = lightboxIndex;
    const hue = (i * 47) % 360;
    lightboxImg.src = imgSrc || `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 600 400%22><rect fill=%22hsl(${hue},30%25,25%25)%22 width=%22600%22 height=%22400%22/><text x=%22300%22 y=%22200%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2280%22>📷</text></svg>`;
    lightboxCaption.textContent = `${photo.title} · ${photo.group || ''} · ${formatDate(photo.date)}`;
    lightbox.classList.add('open');
  }

  function closeLightbox() {
    lightbox?.classList.remove('open');
  }

  function navigateLightbox(direction) {
    lightboxIndex += direction;
    if (lightboxIndex < 0) lightboxIndex = currentFiltered.length - 1;
    if (lightboxIndex >= currentFiltered.length) lightboxIndex = 0;
    openLightbox();
  }

  // 灯箱事件
  document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev')?.addEventListener('click', () => navigateLightbox(-1));
  document.getElementById('lightboxNext')?.addEventListener('click', () => navigateLightbox(1));
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (!lightbox?.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });

  // 分组筛选
  groupFilterEl?.addEventListener('click', (e) => {
    const chip = e.target.closest('.category-chip');
    if (!chip) return;
    groupFilterEl.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeGroup = chip.dataset.group || '';
    renderGrid();
  });

  // 年份筛选
  yearFilterEl?.addEventListener('click', (e) => {
    const chip = e.target.closest('.category-chip');
    if (!chip) return;
    yearFilterEl.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeYear = chip.dataset.year || '';
    renderGrid();
  });

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
