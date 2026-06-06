/**
 * 随笔详情页：加载 Markdown 并渲染
 */
(function () {
  'use strict';

  const detailEl = document.getElementById('essayDetail');

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    if (!slug) { showError('缺少文章标识'); return; }

    try {
      const resp = await fetch('data/essays.json');
      if (!resp.ok) throw new Error('加载文章列表失败');
      const essays = await resp.json();
      const meta = essays.find(e => e.slug === slug);
      if (!meta) { showError('未找到该文章'); return; }

      document.title = `${meta.title} - HHHPf's Space`;

      // 加载 Markdown
      const filePath = meta.file || `${slug}.md`;
      const mdResp = await fetch(`posts/${filePath}`);
      if (!mdResp.ok) throw new Error(`无法加载: ${filePath}`);
      const markdown = await mdResp.text();

      // 配置 marked
      if (typeof marked !== 'undefined') {
        marked.setOptions({ breaks: true, gfm: true });
        if (typeof hljs !== 'undefined') {
          marked.setOptions({
            highlight: function (code, lang) {
              if (lang && hljs.getLanguage(lang)) {
                try { return hljs.highlight(code, { language: lang }).value; } catch (_) {}
              }
              return code;
            }
          });
        }
      }

      const content = typeof marked !== 'undefined' ? marked.parse(markdown) : `<pre>${escapeHTML(markdown)}</pre>`;

      detailEl.innerHTML = `
        ${meta.coverEmoji ? `<div style="text-align:center; font-size:6rem; margin-bottom:20px;">${meta.coverEmoji}</div>` : ''}
        <article>
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <h1>${escapeHTML(meta.title)}</h1>
            <button class="copy-btn" id="copyBtn" title="复制全文">📋 复制</button>
          </div>
          <div class="essay-meta" style="margin-top:8px;">
            <span>📅 ${formatDate(meta.date)}</span>
            <span class="category-tag">${escapeHTML(meta.category || '未分类')}</span>
          </div>
          <div class="essay-content">${content}</div>
        </article>
      `;

      // 代码高亮
      if (typeof hljs !== 'undefined') {
        detailEl.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
      }

      // 一键复制
      document.getElementById('copyBtn')?.addEventListener('click', () => {
        const text = detailEl.querySelector('.essay-content')?.innerText || '';
        navigator.clipboard.writeText(text).then(() => {
          const btn = document.getElementById('copyBtn');
          btn.textContent = '✅ 已复制';
          setTimeout(() => { btn.textContent = '📋 复制'; }, 2000);
        }).catch(() => alert('复制失败，请手动选择'));
      });

    } catch (err) {
      showError(`❌ ${err.message}`);
    }
  }

  function showError(msg) {
    if (detailEl) detailEl.innerHTML = `<div class="error">${msg}</div>`;
    document.title = '错误 - HHHPf\'s Space';
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
