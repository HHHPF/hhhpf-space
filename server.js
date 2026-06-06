/**
 * 个人网站后台服务器
 * 功能：静态文件服务 + 登录认证 + 内容管理 API + 图片上传
 * 启动：node server.js
 */
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// ===== 管理员密码（修改此处）=====
const ADMIN_PASSWORD = 'hhhpf2026';

// ===== 中间件 =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // 静态文件

app.use(session({
  secret: 'hhhpf-space-secret-' + Date.now(),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24小时
}));

// 图片上传
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

// ===== 认证中间件 =====
function requireAuth(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  res.status(401).json({ error: '未登录' });
}

// ===== 工具函数 =====
function readJSON(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
  catch { return null; }
}
function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ===== 登录 API =====
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.loggedIn = true;
    res.json({ success: true });
  } else {
    res.status(403).json({ error: '密码错误' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
  res.json({ loggedIn: !!req.session.loggedIn });
});

// ===== 📝 随笔 API =====
const ESSAYS_FILE = path.join(__dirname, 'data', 'essays.json');
const POSTS_DIR = path.join(__dirname, 'posts');

app.get('/api/essays', requireAuth, (req, res) => {
  const essays = readJSON(ESSAYS_FILE) || [];
  res.json(essays);
});

app.post('/api/essays', requireAuth, (req, res) => {
  const { title, category, excerpt, content, slug, date, coverEmoji } = req.body;
  if (!title || !slug) return res.status(400).json({ error: '标题和标识不能为空' });

  const essays = readJSON(ESSAYS_FILE) || [];
  const index = essays.findIndex(e => e.slug === slug);

  const essayMeta = {
    slug,
    title,
    date: date || new Date().toISOString().slice(0, 10),
    category: category || '日常碎碎念',
    excerpt: excerpt || '',
    coverColor: '#a8927c',
    coverColor2: '#6b5b4f',
    coverEmoji: coverEmoji || '📝',
    file: slug + '.md'
  };

  if (index >= 0) {
    essays[index] = { ...essays[index], ...essayMeta };
  } else {
    essays.push(essayMeta);
  }

  writeJSON(ESSAYS_FILE, essays);
  // 写 Markdown 文件
  fs.writeFileSync(path.join(POSTS_DIR, slug + '.md'), content || '', 'utf-8');

  res.json({ success: true, essay: essayMeta });
});

app.delete('/api/essays/:slug', requireAuth, (req, res) => {
  const essays = readJSON(ESSAYS_FILE) || [];
  const filtered = essays.filter(e => e.slug !== req.params.slug);
  writeJSON(ESSAYS_FILE, filtered);
  // 删除 md 文件
  const mdPath = path.join(POSTS_DIR, req.params.slug + '.md');
  if (fs.existsSync(mdPath)) fs.unlinkSync(mdPath);
  res.json({ success: true });
});

// 获取单篇随笔（编辑用）
app.get('/api/essays/:slug', requireAuth, (req, res) => {
  const essays = readJSON(ESSAYS_FILE) || [];
  const essay = essays.find(e => e.slug === req.params.slug);
  if (!essay) return res.status(404).json({ error: '未找到' });

  let content = '';
  const mdPath = path.join(POSTS_DIR, essay.file || (essay.slug + '.md'));
  if (fs.existsSync(mdPath)) content = fs.readFileSync(mdPath, 'utf-8');

  res.json({ ...essay, content });
});

// ===== 📷 画廊 API =====
const GALLERY_FILE = path.join(__dirname, 'data', 'gallery.json');

app.get('/api/gallery', requireAuth, (req, res) => {
  res.json(readJSON(GALLERY_FILE) || []);
});

app.post('/api/gallery', requireAuth, upload.single('image'), (req, res) => {
  const { title, group, date } = req.body;
  const gallery = readJSON(GALLERY_FILE) || [];

  const photo = {
    title: title || '未命名',
    date: date || new Date().toISOString().slice(0, 10),
    group: group || '日常随拍',
    year: new Date(date || Date.now()).getFullYear()
  };

  // 如果上传了图片，使用服务器路径
  if (req.file) {
    photo.file = 'uploads/' + req.file.filename;
    photo.url = 'uploads/' + req.file.filename;
  }

  gallery.unshift(photo);
  writeJSON(GALLERY_FILE, gallery);
  res.json({ success: true, photo });
});

app.delete('/api/gallery/:index', requireAuth, (req, res) => {
  const gallery = readJSON(GALLERY_FILE) || [];
  const idx = parseInt(req.params.index);
  if (isNaN(idx) || idx < 0 || idx >= gallery.length) {
    return res.status(400).json({ error: '无效索引' });
  }
  // 删除图片文件
  const photo = gallery[idx];
  if (photo.file && !photo.file.startsWith('http')) {
    const imgPath = path.join(__dirname, photo.file);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  gallery.splice(idx, 1);
  writeJSON(GALLERY_FILE, gallery);
  res.json({ success: true });
});

// 图片批量上传
app.post('/api/gallery/batch', requireAuth, upload.array('images', 20), (req, res) => {
  const { titles, groups } = req.body;
  const gallery = readJSON(GALLERY_FILE) || [];
  const added = [];

  if (req.files) {
    req.files.forEach((file, i) => {
      const photo = {
        title: (titles && titles[i]) || '未命名 ' + (i + 1),
        date: new Date().toISOString().slice(0, 10),
        group: (groups && groups[i]) || '日常随拍',
        year: new Date().getFullYear(),
        file: 'uploads/' + file.filename,
        url: 'uploads/' + file.filename
      };
      gallery.unshift(photo);
      added.push(photo);
    });
    writeJSON(GALLERY_FILE, gallery);
  }
  res.json({ success: true, added });
});

// ===== 🎯 瓦罗兰特 API =====
const VALORANT_FILE = path.join(__dirname, 'data', 'valorant.json');

app.get('/api/valorant', requireAuth, (req, res) => {
  res.json(readJSON(VALORANT_FILE) || { videos: [], screenshots: [] });
});

// 截图管理
app.post('/api/valorant/screenshots', requireAuth, upload.single('image'), (req, res) => {
  const { title, map, type, hero, date } = req.body;
  const data = readJSON(VALORANT_FILE) || { videos: [], screenshots: [] };

  const screenshot = {
    title: title || '未命名',
    date: date || new Date().toISOString().slice(0, 10),
    map: map || '',
    type: type || '高光',
    hero: hero || ''
  };
  if (req.file) {
    screenshot.url = 'uploads/' + req.file.filename;
  }

  data.screenshots.unshift(screenshot);
  writeJSON(VALORANT_FILE, data);
  res.json({ success: true, screenshot });
});

app.delete('/api/valorant/screenshots/:index', requireAuth, (req, res) => {
  const data = readJSON(VALORANT_FILE) || { videos: [], screenshots: [] };
  const idx = parseInt(req.params.index);
  if (isNaN(idx) || idx < 0 || idx >= data.screenshots.length) {
    return res.status(400).json({ error: '无效索引' });
  }
  data.screenshots.splice(idx, 1);
  writeJSON(VALORANT_FILE, data);
  res.json({ success: true });
});

// 视频管理
app.post('/api/valorant/videos', requireAuth, (req, res) => {
  const { title, bvid, douyin, mp4, heroes, map, date } = req.body;
  const data = readJSON(VALORANT_FILE) || { videos: [], screenshots: [] };

  const video = {
    title: title || '未命名',
    date: date || new Date().toISOString().slice(0, 10),
    heroes: heroes ? (Array.isArray(heroes) ? heroes : heroes.split(',').map(h => h.trim())) : [],
    map: map || ''
  };
  if (bvid) video.bvid = bvid;
  if (douyin) video.douyin = douyin;
  if (mp4) video.mp4 = mp4;

  data.videos.unshift(video);
  writeJSON(VALORANT_FILE, data);
  res.json({ success: true, video });
});

app.delete('/api/valorant/videos/:index', requireAuth, (req, res) => {
  const data = readJSON(VALORANT_FILE) || { videos: [], screenshots: [] };
  const idx = parseInt(req.params.index);
  if (idx < 0 || idx >= data.videos.length) return res.status(400).json({ error: '无效索引' });
  data.videos.splice(idx, 1);
  writeJSON(VALORANT_FILE, data);
  res.json({ success: true });
});

// ===== 启动服务器 =====
app.listen(PORT, () => {
  console.log('=========================================');
  console.log('  HHHPf Space 后台服务器已启动');
  console.log('  前台：http://localhost:' + PORT);
  console.log('  后台：http://localhost:' + PORT + '/admin/login.html');
  console.log('  默认密码：' + ADMIN_PASSWORD);
  console.log('=========================================');
});
