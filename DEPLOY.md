# 项目部署指南

本项目是一个基于 Vite + React 的单页应用，可以通过多种方式部署到线上。

## 方案一：Vercel 部署（推荐，最简单）

### 优点
- 免费，自动 HTTPS
- 自动部署（连接 GitHub 后）
- 全球 CDN 加速
- 配置简单

### 步骤

1. **准备代码**
   ```bash
   # 确保代码已提交到 Git
   git add .
   git commit -m "准备部署"
   ```

2. **推送到 GitHub**
   - 在 GitHub 创建新仓库
   - 推送代码：
   ```bash
   git remote add origin https://github.com/你的用户名/仓库名.git
   git push -u origin main
   ```

3. **部署到 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录
   - 点击 "New Project"
   - 导入你的 GitHub 仓库
   - 配置：
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - 点击 "Deploy"

4. **配置自定义域名**
   - 在 Vercel 项目设置中找到 "Domains"
   - 添加你的域名
   - 按照提示配置 DNS：
     - 添加 CNAME 记录：`www` -> `cname.vercel-dns.com`
     - 或添加 A 记录：`@` -> Vercel 提供的 IP 地址
   - 等待 DNS 生效（通常几分钟到几小时）

---

## 方案二：Netlify 部署

### 步骤

1. **推送到 GitHub**（同上）

2. **部署到 Netlify**
   - 访问 [netlify.com](https://netlify.com)
   - 使用 GitHub 账号登录
   - 点击 "Add new site" -> "Import an existing project"
   - 选择你的 GitHub 仓库
   - 配置：
     - Build command: `npm run build`
     - Publish directory: `dist`
   - 点击 "Deploy site"

3. **配置自定义域名**
   - 在 Netlify 项目设置中找到 "Domain settings"
   - 点击 "Add custom domain"
   - 输入你的域名
   - 按照提示配置 DNS 记录

---

## 方案三：GitHub Pages 部署

### 步骤

1. **安装 gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **修改 package.json**
   添加部署脚本：
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **修改 vite.config.js**
   ```javascript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     base: '/你的仓库名/', // 如果仓库名是 my-app，则改为 '/my-app/'
     server: {
       port: 3000,
       open: true
     }
   })
   ```

4. **部署**
   ```bash
   npm run deploy
   ```

5. **配置 GitHub Pages**
   - 在 GitHub 仓库设置中找到 "Pages"
   - Source 选择 "gh-pages" 分支
   - 保存

6. **配置自定义域名**
   - 在仓库根目录创建 `CNAME` 文件
   - 内容：你的域名（如：example.com）
   - 配置 DNS：添加 CNAME 记录指向 `你的用户名.github.io`

---

## 方案四：自己的服务器部署

### 步骤

1. **构建项目**
   ```bash
   npm run build
   ```
   这会生成 `dist` 目录

2. **上传文件**
   - 将 `dist` 目录中的所有文件上传到服务器
   - 可以使用 FTP、SCP 或 rsync：
   ```bash
   scp -r dist/* user@your-server.com:/var/www/html/
   ```

3. **配置 Nginx**
   创建配置文件 `/etc/nginx/sites-available/your-site`：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;
       
       root /var/www/html;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```
   
   启用配置：
   ```bash
   sudo ln -s /etc/nginx/sites-available/your-site /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **配置 HTTPS（推荐）**
   使用 Let's Encrypt：
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

5. **配置 DNS**
   - 添加 A 记录：`@` -> 你的服务器 IP
   - 添加 A 记录：`www` -> 你的服务器 IP

---

## 本地测试构建

在部署前，可以先本地测试构建：

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

访问 `http://localhost:4173` 查看效果。

---

## 常见问题

### 1. 路由问题（404）
如果使用客户端路由，需要配置服务器将所有请求重定向到 `index.html`。

### 2. 资源路径错误
确保 `vite.config.js` 中的 `base` 配置正确。

### 3. 环境变量
如果有环境变量，需要在部署平台配置：
- Vercel: 项目设置 -> Environment Variables
- Netlify: 站点设置 -> Environment variables

---

## 推荐方案

**对于个人项目，推荐使用 Vercel：**
- ✅ 完全免费
- ✅ 配置最简单
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 自动部署（Git push 后自动部署）

只需要：
1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置域名 DNS
4. 完成！

