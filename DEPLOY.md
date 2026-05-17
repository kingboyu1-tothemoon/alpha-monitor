# 上线部署指南

当前网站是纯静态站点，只包含 `index.html`、`styles.css`、`app.js`，最适合先用静态托管上线。

## 推荐方案

### 方案一：Vercel

适合后续继续升级成前后端项目。

1. 把当前项目上传到 GitHub。
2. 登录 Vercel。
3. New Project，选择这个 GitHub 仓库。
4. Framework Preset 选择 Other。
5. Build Command 留空。
6. Output Directory 填 `.`。
7. Deploy。

部署完成后，Vercel 会给你一个线上地址，例如：

```text
https://your-project.vercel.app
```

### 方案二：Netlify

适合最快发布静态页面。

1. 登录 Netlify。
2. Add new site。
3. 选择 Import from Git，或者直接拖拽整个项目文件夹。
4. Build Command 留空。
5. Publish directory 填 `.`。
6. Deploy。

### 方案三：GitHub Pages

适合免费、简单、长期托管。

1. 创建 GitHub 仓库并上传文件。
2. 进入仓库 Settings。
3. 打开 Pages。
4. Source 选择 Deploy from a branch。
5. Branch 选择 `main`，目录选择 `/root`。
6. Save。

GitHub 会生成类似地址：

```text
https://your-name.github.io/your-repo/
```

## 自定义域名

上线后可以绑定自己的域名，例如：

```text
alpha.yourdomain.com
```

通常步骤：

1. 在部署平台添加 Custom Domain。
2. 去域名服务商添加 DNS 记录。
3. 等待 HTTPS 证书自动签发。

## 后续接真实数据时

现在前端使用的是 `app.js` 里的模拟数据。接线上数据时建议增加：

1. 后端 API：负责拉取 Polygon、Tradier、SEC EDGAR、CoinGlass 等数据源。
2. 数据库：保存标的、信号、评分、提醒历史。
3. 定时任务：每隔几分钟刷新资金、财报、行业、舆情信号。
4. AI 分析服务：把原始数据压缩成结论、证据和评分。
5. 推送服务：Telegram、Discord、邮件、App Push。

推荐升级路线：

```text
静态站点上线
→ 接一个简单后端 API
→ 接数据库
→ 接数据源
→ 接 AI 评分
→ 接推送提醒
```

## 当前项目已预留的线上 API

部署到 Vercel 后可访问：

```text
/api/health
/api/monitoring
/api/refresh
```

`/api/monitoring` 是前端默认读取的线上监控快照。  
`/api/stocks?symbols=MRVL,VST,NVDA` 会尝试读取股票数据源。  
`/api/refresh` 是手动刷新入口，不再依赖 Vercel Cron。

需要在 Vercel Environment Variables 配置：

```text
POLYGON_API_KEY
FMP_API_KEY
SEC_USER_AGENT
REFRESH_SECRET
```

## Vercel 部署设置

项目现在包含 `package.json` 和 `vercel.json`，不包含 Cron Job。

Vercel 项目建议保持：

```text
Framework Preset: Other
Build Command: npm run build
Output Directory: .
Install Command: 默认
Root Directory: 仓库根目录
```

如果部署后首页打不开，优先检查：

1. Vercel 的 Root Directory 是否指向包含 `index.html` 的目录。
2. GitHub 是否已经提交并推送 `package.json` 和 `vercel.json`。
3. Deployment Logs 里是否有 API 函数构建错误。
4. 访问 `/api/health` 看 API 是否可用。

## 最小可上线文件

必须包含：

```text
index.html
styles.css
app.js
```

可选包含：

```text
README.md
DEPLOY.md
```
