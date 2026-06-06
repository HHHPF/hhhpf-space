/**
 * 首页逻辑：Banner 轮播 + 快捷卡片预览 + 最新随笔 + 热门集锦
 */
(function () {
  'use strict';

  // ===== Banner 轮播 =====
  let currentSlide = 0;
  const slidesEl = document.getElementById('bannerSlides');
  const dots = document.querySelectorAll('#bannerDots button');
  const totalSlides = dots.length;

  function goToSlide(n) {
    currentSlide = (n + totalSlides) % totalSlides;
    if (slidesEl) slidesEl.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
  }

  document.getElementById('bannerPrev')?.addEventListener('click', () => goToSlide(currentSlide - 1));
  document.getElementById('bannerNext')?.addEventListener('click', () => goToSlide(currentSlide + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goToSlide(i)));

  // 自动轮播
  let autoSlide = setInterval(() => goToSlide(currentSlide + 1), 5000);
  const banner = document.getElementById('banner');
  banner?.addEventListener('mouseenter', () => clearInterval(autoSlide));
  banner?.addEventListener('mouseleave', () => { autoSlide = setInterval(() => goToSlide(currentSlide + 1), 5000); });

  // ===== 加载数据并渲染预览 =====
  async function init() {
    try {
      const [essaysResp, galleryResp, valorantResp] = await Promise.all([
        fetch('data/essays.json').then(r => r.json()),
        fetch('data/gallery.json').then(r => r.json()),
        fetch('data/valorant.json').then(r => r.json()),
      ]);

      renderEssayPreview(essaysResp);
      renderGalleryPreview(galleryResp);
      renderValorantPreview(valorantResp);
      renderLatestEssays(essaysResp);
      renderHotClips(valorantResp);
    } catch (err) {
      console.error('加载首页数据失败:', err);
    }
  }

  function renderEssayPreview(essays) {
    const el = document.getElementById('essayPreview');
    if (!el) return;
    const recent = essays.slice(0, 3);
    el.innerHTML = recent.map(e => `<li>📝 ${escapeHTML(e.title)}</li>`).join('');
  }

  function renderGalleryPreview(gallery) {
    const el = document.getElementById('galleryPreview');
    if (!el) return;
    const recent = gallery.slice(0, 6);
    el.innerHTML = recent.map(g => {
      const svgColor = g.group === '日常随拍' ? '%234a6fa5' : g.group === '氛围感写真' ? '%238b5e3c' : '%234a7c59';
      return `<img src="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22${svgColor}%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2230%22>📷</text></svg>" alt="${escapeHTML(g.title)}" title="${escapeHTML(g.title)}">`;
    }).join('');
  }

  function renderValorantPreview(valorant) {
    const el = document.getElementById('valorantPreview');
    if (!el) return;
    const screenshots = valorant.screenshots || [];
    const recent = screenshots.slice(0, 3);
    el.innerHTML = recent.map(s => `<li>🎯 ${escapeHTML(s.title)}</li>`).join('') || '<li style="color:var(--text-muted)">暂无截图</li>';
  }

  function renderLatestEssays(essays) {
    const el = document.getElementById('latestEssays');
    if (!el) return;
    const recent = essays.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
    el.innerHTML = recent.map(e => `
      <article class="essay-card" onclick="location.href='essay-detail.html?slug=${encodeURIComponent(e.slug)}'">
        <div class="essay-cover" style="background:linear-gradient(135deg, ${e.coverColor || '#444'} 0%, ${e.coverColor2 || '#222'} 100%); display:flex; align-items:center; justify-content:center; font-size:3rem;">${e.coverEmoji || '📝'}</div>
        <div class="essay-info">
          <h3><a href="essay-detail.html?slug=${encodeURIComponent(e.slug)}">${escapeHTML(e.title)}</a></h3>
          <div class="essay-meta">
            <span>📅 ${formatDate(e.date)}</span>
            <span class="category-tag">${escapeHTML(e.category || '未分类')}</span>
          </div>
          <p class="essay-excerpt">${escapeHTML(e.excerpt || '')}</p>
        </div>
      </article>
    `).join('') || '<div class="empty">暂无随笔</div>';
  }

  function renderHotClips(valorant) {
    const el = document.getElementById('hotClips');
    if (!el) return;
    const screenshots = (valorant.screenshots || []).slice(0, 4);
    el.innerHTML = screenshots.map(s => `<li>🔥 ${escapeHTML(s.title)}</li>`).join('')
      || '<li style="color:var(--text-muted)">暂无截图</li>';
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

  // 滚动触发动画 (Apple 风格渐进显示)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.animate-in').forEach(el => observer.observe(el));
})();
