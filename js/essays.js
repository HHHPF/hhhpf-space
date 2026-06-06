/**
 * 随笔列表页：分页 + 分类筛选
 */
(function () {
  'use strict';

  const POSTS_PER_PAGE = 6;
  let allEssays = [];
  let activeCategory = '';
  let currentPage = 1;

  const listEl = document.getElementById('essayList');
  const paginationEl = document.getElementById('pagination');
  const filterEl = document.getElementById('categoryFilters');

  async function init() {
    try {
      const resp = await fetch('data/essays.json');
      if (!resp.ok) throw new Error('加载失败');
      allEssays = await resp.json();
      allEssays.sort((a, b) => new Date(b.date) - new Date(a.date));
      render();
    } catch (err) {
      if (listEl) listEl.innerHTML = `<div class="error">❌ ${err.message}</div>`;
    }
  }

  function render() {
    const filtered = activeCategory
      ? allEssays.filter(e => e.category === activeCategory)
      : allEssays;

    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="empty">📭 该分类下暂无随笔</div>';
      paginationEl.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * POSTS_PER_PAGE;
    const pageItems = filtered.slice(start, start + POSTS_PER_PAGE);

    listEl.innerHTML = pageItems.map(e => `
      <article class="essay-card" onclick="location.href='essay-detail.html?slug=${encodeURIComponent(e.slug)}'">
        <div class="essay-cover" style="background:linear-gradient(135deg, ${e.coverColor || '#a8927c'} 0%, ${e.coverColor2 || '#6b5b4f'} 100%); display:flex; align-items:center; justify-content:center; font-size:3rem;">${e.coverEmoji || '📝'}</div>
        <div class="essay-info">
          <h3>${escapeHTML(e.title)}</h3>
          <div class="essay-meta">
            <span>📅 ${formatDate(e.date)}</span>
            <span class="category-tag">${escapeHTML(e.category || '未分类')}</span>
          </div>
          <p class="essay-excerpt">${escapeHTML(e.excerpt || '')}</p>
        </div>
      </article>
    `).join('');

    // 分页
    if (totalPages > 1) {
      paginationEl.innerHTML = `
        <button ${currentPage === 1 ? 'disabled' : ''} id="prevPage">← 上一页</button>
        <span class="page-info">${currentPage} / ${totalPages}</span>
        <button ${currentPage === totalPages ? 'disabled' : ''} id="nextPage">下一页 →</button>
      `;
      document.getElementById('prevPage')?.addEventListener('click', () => { currentPage--; render(); scroll(); });
      document.getElementById('nextPage')?.addEventListener('click', () => { currentPage++; render(); scroll(); });
    } else {
      paginationEl.innerHTML = '';
    }
  }

  function scroll() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

  // 分类筛选
  if (filterEl) {
    filterEl.addEventListener('click', (e) => {
      const chip = e.target.closest('.category-chip');
      if (!chip) return;
      filterEl.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.dataset.category || '';
      currentPage = 1;
      render();
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
