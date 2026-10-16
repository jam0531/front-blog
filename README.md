# front-blog

十二个人博客的独立前端。Vue 3 + Vite + Vue Router，使用 JavaScript 和原生 fetch。

后端仓库：[backend-blog](https://github.com/jam0531/backend-blog)。本仓库与后端分别构建、发布。

## 当前进度

已写入欢迎页、首页、文章分页、详情页和 404 页，包含加载、错误、空列表状态。业务 ID 全程按字符串传递。

这是分离改造中的第一批代码，并非整站迁移完成。分类搜索、后台管理、评论留言等按后续计划实现。前端依赖安装尚受本机 npm 下载策略限制，未生成锁文件，也尚未通过构建和浏览器联调；不把源码存在视为已验证可用。

## 本地启动

需要 Node.js 20.19+ 或 22.12+（当前开发机为 24.22.0）。依赖及兼容范围锁定在 package.json。

在允许下载项目依赖后执行：

```sh
npm install
npm run dev
```

访问 `http://127.0.0.1:5173`。Vite 将 `/api` 转发到 `http://127.0.0.1:18080`，保留 `/api` 前缀。可将 `.env.example` 复制为不入库的 `.env.local` 后修改 `BACKEND_URL`。不要向前端环境变量写入数据库凭据。

首次安装成功后应提交生成的 package-lock.json，后续使用 npm ci。

## 构建与发布

```sh
npm run build
npm run preview
```

构建产物为 `dist/`，预览端口为 4173。开发/预览代理由 Vite 提供；正式部署需要由 Web 服务器转发 `/api/`，其他前端页面路由回退到 index.html，API 错误不得回退成页面 HTML。

当前页面路由：`/`、`/home?page=1`、`/blog/:id`。前端只消费后端安全渲染的 contentHtml；不直接把 Markdown 原文插入页面。

## 验证限制

没有新增测试代码；没有在仓库中存放 node_modules、构建产物或本地配置。后续工作先完成依赖安装和本地构建，再做真实浏览器联调。
