# 产品展示网站（全栈版）

包含后端数据共享与访问统计功能的网站。

## 功能特性

- 欢迎页（两个按钮跳转主页面）
- 主介绍页（左侧标签导航 + 右侧内容展示，固定布局不跳动）
- 管理后台（所有内容可在线编辑）
- **多人共享同一份内容**（数据存在服务器端，所有人看到相同内容）
- **访问统计**（总访问次数、独立访客数、每日趋势、访客详情）

## 目录结构

```
website/
├── server.js          # Node.js 后端服务器
├── package.json       # 依赖声明
├── data.json          # 数据存储文件（自动生成）
├── README.md          # 本说明文档
└── public/
    └── index.html     # 前端页面
```

## 部署步骤

### 1. 环境要求

- Node.js 14 或更高版本

### 2. 安装依赖

```bash
cd website
npm install
```

### 3. 启动服务器

```bash
npm start
```

或直接运行：

```bash
node server.js
```

启动后访问 `http://localhost:3000` 即可查看网站。

### 4. 修改端口（可选）

默认端口为 3000，可通过环境变量修改：

```bash
# Linux / macOS
PORT=8080 npm start

# Windows (PowerShell)
$env:PORT=8080; npm start
```

### 5. 修改管理密码（可选）

默认管理密码为 `admin123`，可通过环境变量修改：

```bash
# Linux / macOS
ADMIN_PASSWORD=你的密码 npm start

# Windows (PowerShell)
$env:ADMIN_PASSWORD="你的密码"; npm start
```

### 6. 生产环境部署（推荐）

使用 PM2 进行进程守护：

```bash
npm install -g pm2
pm2 start server.js --name website
pm2 save
pm2 startup
```

使用 Nginx 反向代理（示例配置）：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 管理后台使用

1. 点击页面右上角的齿轮图标进入管理后台
2. 在顶部输入管理密码（默认 `admin123`），点击「验证」
3. 验证成功后可编辑以下内容：
   - **欢迎页**：小标签、大标题、描述、两个按钮文字
   - **主页面**：页面标题、简介
   - **标签内容**：添加/编辑/删除左侧标签及对应内容（支持HTML）
   - **底部与链接**：版权、备案号、友情链接
   - **访问统计**：查看访问数据
4. 编辑完成后点击对应页面的「保存」按钮同步到服务器

## 访问统计说明

- **总访问次数**：所有页面加载的累计次数
- **独立访客数**：按 IP 地址去重的访客数量
- **人均访问次数**：总访问次数 / 独立访客数
- **访问趋势**：最近 14 天的每日访问量柱状图
- **访客详情**：每个 IP 的访问次数、首次访问时间、最近访问时间

> 注意：同一局域网内的用户可能共享同一个公网 IP，会被统计为同一访客。

## 数据备份

网站所有数据存储在 `data.json` 文件中，定期备份此文件即可。

## 常见问题

**Q: 页面显示"内容加载失败"？**
A: 请确认服务器已启动，且访问地址和端口正确。

**Q: 管理密码忘记了怎么办？**
A: 在服务器上设置环境变量 `ADMIN_PASSWORD` 重新指定密码，然后重启服务器。

**Q: 如何修改默认内容？**
A: 首次启动后进入管理后台编辑即可；也可以直接修改 `server.js` 中的 `defaultContent` 对象。

**Q: 访问统计数据可以清空吗？**
A: 停止服务器后，编辑 `data.json` 文件，将 `stats` 字段重置为 `{"totalVisits":0,"visitors":{}}`，然后重启服务器。
