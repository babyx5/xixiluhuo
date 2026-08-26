const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== 数据读写 =====
function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return { content: null, stats: { totalVisits: 0, visitors: {} } };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ===== 默认内容 =====
const defaultContent = {
  welcome: {
    eyebrow: 'WELCOME',
    title: '欢迎来到我们的平台',
    subtitle: '探索更多精彩内容，开启你的全新体验之旅。我们致力于为每一位用户提供优质的服务和内容。',
    btn1: '点击了解',
    btn2: '加入我们'
  },
  main: {
    title: '关于我们',
    subtitle: '这里是平台的简介文字，介绍我们的理念、愿景和核心价值。点击左侧标签查看更多详细内容。',
    tabs: [
      { id: 't1', name: '公司简介', content: '<p>我们是一家专注于创新科技的公司，成立于2020年，致力于为用户提供高品质的产品和服务。</p><p>公司拥有一支经验丰富的团队，涵盖技术研发、产品设计、市场运营等多个领域，始终以用户需求为核心，不断探索和创新。</p>' },
      { id: 't2', name: '产品服务', content: '<p>我们提供全方位的产品和服务解决方案：</p><p><strong>核心产品：</strong>智能管理系统、数据分析平台、移动端应用。</p><p><strong>专业服务：</strong>定制开发、技术咨询、运维支持、培训服务。</p><p>我们根据客户的实际需求，提供灵活、高效的解决方案。</p>' },
      { id: 't3', name: '团队介绍', content: '<p>我们的团队由一群充满激情和创造力的专业人士组成。</p><p>核心成员均拥有5年以上行业经验，曾服务于多家知名企业。团队氛围开放、平等，鼓励创新和分享。</p><p>我们相信，优秀的团队是创造优秀产品的基础。</p>' },
      { id: 't4', name: '联系我们', content: '<p>欢迎与我们取得联系！</p><p><strong>邮箱：</strong>contact@example.com</p><p><strong>电话：</strong>400-888-8888</p><p><strong>地址：</strong>北京市朝阳区科技园区88号</p><p>工作时间：周一至周五 9:00 - 18:00</p>' }
    ]
  },
  footer: {
    copyright: '© 2026 公司名称 版权所有',
    icp: '京ICP备XXXXXXXX号',
    links: [
      { id: 'l1', name: '关于我们', url: '#' },
      { id: 'l2', name: '产品服务', url: '#' },
      { id: 'l3', name: '新闻动态', url: '#' },
      { id: 'l4', name: '联系我们', url: '#' }
    ]
  }
};

// ===== 密码验证中间件 =====
function verifyPassword(req, res, next) {
  const password = req.body.password || req.query.password;
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: '管理密码错误' });
  }
  next();
}

// ===== API 路由 =====

// 获取网站内容（公开）
app.get('/api/content', (req, res) => {
  const data = readData();
  res.json({ content: data.content || defaultContent });
});

// 保存网站内容（需密码）
app.post('/api/content', verifyPassword, (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: '内容不能为空' });
  }
  const data = readData();
  data.content = content;
  writeData(data);
  res.json({ success: true, message: '保存成功' });
});

// 记录一次访问（公开）
app.post('/api/track', (req, res) => {
  const ip = (req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress || 'unknown').toString();
  // 处理 IPv6 映射的 IPv4
  const clientIp = ip.replace('::ffff:', '').replace('::1', '127.0.0.1');
  const now = new Date().toISOString();

  const data = readData();
  if (!data.stats) data.stats = { totalVisits: 0, visitors: {} };

  data.stats.totalVisits++;

  if (!data.stats.visitors[clientIp]) {
    data.stats.visitors[clientIp] = { count: 0, firstVisit: now, lastVisit: now, visits: [] };
  }
  const v = data.stats.visitors[clientIp];
  v.count++;
  v.lastVisit = now;
  v.visits.push(now);
  // 只保留最近 200 条访问记录，防止文件过大
  if (v.visits.length > 200) v.visits = v.visits.slice(-200);

  writeData(data);
  res.json({ success: true });
});

// 获取访问统计（需密码）
app.get('/api/stats', verifyPassword, (req, res) => {
  const data = readData();
  const stats = data.stats || { totalVisits: 0, visitors: {} };

  const visitorList = Object.entries(stats.visitors).map(([ip, v]) => ({
    ip,
    count: v.count,
    firstVisit: v.firstVisit,
    lastVisit: v.lastVisit,
    recentVisits: v.visits.slice(-10).reverse()
  })).sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));

  // 按日期统计访问量
  const dailyStats = {};
  Object.values(stats.visitors).forEach(v => {
    v.visits.forEach(time => {
      const day = time.substring(0, 10);
      dailyStats[day] = (dailyStats[day] || 0) + 1;
    });
  });
  const dailyList = Object.entries(dailyStats)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  res.json({
    totalVisits: stats.totalVisits,
    uniqueVisitors: visitorList.length,
    visitors: visitorList,
    dailyStats: dailyList
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  网站服务器已启动');
  console.log('  访问地址: http://localhost:' + PORT);
  console.log('  管理密码: ' + ADMIN_PASSWORD + ' (可在环境变量 ADMIN_PASSWORD 中修改)');
  console.log('========================================');
});
