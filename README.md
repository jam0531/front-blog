# front-blog

十二个人博客的独立前端。Vue 3 + Vite + Vue Router，使用 JavaScript 和原生 fetch。

后端仓库：[backend-blog](https://github.com/jam0531/backend-blog)。本仓库与后端分别构建、发布。

## 当前进度

已实现欢迎页、首页、文章分页、详情页、分类、标签、搜索、归档和 404 页，包含加载、错误、空列表状态。业务 ID 全程按字符串传递。搜索范围为标题和摘要。

导航栏的“首页排版”可切换留白杂志、文字专栏、图文画廊。选择保存在当前浏览器；URL 中有效的 layout 参数优先，切换保留当前页码。三种排版使用相同文章列表与顺序，每页 6 篇。`/home-layouts` 保留方案对照说明，正式首页不显示预览说明。

分类、归档、搜索及分类/标签/年份的文章列表沿用当前首页风格。分类以主题卡片和标签展示，归档按年份展示；搜索结果复用首页文章样式，保留每页 10 篇及原有筛选参数。

后台已实现登录、文章列表、Markdown 编辑与安全预览、草稿/发布、分类和标签管理。编辑器沿用项目已有的 Editor.md 和 jQuery，仅在后台 iframe 内按需加载，不向公开页面注入旧插件。新增和编辑仅提交可编辑字段，ID 始终使用字符串。

依赖已按授权安装，已生成 package-lock.json，生产构建和本地浏览已通过。公告、相册、友链、关于页面、评论留言及其后台管理已实现并完成分组联调；部署配置已准备，尚未实际上线。

## 本地启动

需要 Node.js 20.19+ 或 22.12+（当前开发机为 24.22.0）。依赖及兼容范围锁定在 package.json。

在允许下载项目依赖后执行：

```sh
npm ci
npm run dev
```

访问 `http://127.0.0.1:5173`。Vite 将 `/api` 转发到 `http://127.0.0.1:18080`，保留路径前缀。可将 `.env.example` 复制为不入库的 `.env.local` 后修改 `BACKEND_URL`。不要向前端环境变量写入数据库凭据。

已有 node_modules 时直接执行 npm run dev；在新环境中，获准下载依赖后使用 npm ci 按锁文件安装。

## 构建与发布

```sh
npm run build
npm run preview
```

构建产物为 `dist/`，预览端口为 4173。开发/预览代理由 Vite 提供；正式部署需要由 Web 服务器转发 `/api/`，其他前端页面路由回退到 index.html，API 错误不得回退成页面 HTML。

当前页面路由：`/`、`/home?layout=editorial&page=1`（layout 可取 editorial、journal、gallery）、`/home-layouts`、`/blog/:id`、`/types`、`/type/:id`、`/tag/:id`、`/search`、`/archives`、`/archive/:year`。前端只消费后端安全渲染的 contentHtml；不直接把 Markdown 原文插入页面。

其他页面：`/album`、`/albumArchive/:date`、`/picture/:id`、`/friend-links`、`/about`、`/about-web`、`/messages`。文章评论、普通留言、友链交流按根分页并携带回复，正文只显示纯文本。

后台入口为 `/admin/login`，登录后进入 `/admin/blogs`。其他管理路由：`/admin/blogs/new`、`/admin/blogs/:id/edit`、`/admin/types`、`/admin/tags`。密码和会话令牌不写入 localStorage；通过同源 HttpOnly Session Cookie 鉴权，写请求附带会话 CSRF token，失败不自动重放写请求。管理权限仍由后端检查。

资源与互动管理：`/admin/notices`、`/admin/pictures`、`/admin/friend-links`、`/admin/comments`、`/admin/messages`。完整发布顺序、Nginx 模板、HTTPS、静态缓存和回滚步骤见 [部署说明](docs/deployment.md)。前端可以单独发布；实际服务器切换尚未执行。

## 验证限制

没有新增测试代码；node_modules、构建产物及本地配置均忽略跟踪。已验证三种首页排版切换、分页保留、刷新后选择记忆；分类、年份跳转及组合筛选、刷新条件恢复和清除；首页与分类、归档、搜索的 390px 窄屏无横向溢出。

经用户分组授权，文章与分类标签、资源管理、评论留言分别完成临时数据联调及清理，相关表的完整数据指纹与每组操作前一致。包含后台回复页面实际提交、关闭评论、纯文本渲染、限频及子回复/文章级联清理。留言页 390px 无横向溢出。默认本地后端恢复只读；实际阅读量写入、非管理员真实账号和生产代理未验收。
