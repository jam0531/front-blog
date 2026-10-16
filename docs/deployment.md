# 前端独立发布与回滚

推荐同域部署：Nginx 提供前端 `dist/`，`/api/` 转发 Spring Boot。浏览器无需跨域配置，Session Cookie 与 CSRF 机制保持同源。前端版本更新只替换静态发布目录，无需重启 Java。

## 环境与边界

- 前端构建机：项目 package.json 要求的 Node，已安装且与锁文件一致的依赖。生产静态服务器不必安装 Node。
- 后端：当前项目要求 Java 8、已有 Maven 配置及 MySQL blog 数据库；不自动初始化、更改表结构。默认单实例，Session 保存在本实例内存中；重启后需要重新登录。多实例应另行确定 Session 共享方案，不因已有 Redis 依赖就声称会话已共享。
- 图片继续引用数据库中的地址；HTTPS 页面使用的图片和头像地址也需支持 HTTPS。`/images/...` 等站内地址必须在实际静态目录配置对应文件，不能仅保存地址就认为已部署文件。
- 当前尚无目标服务器、域名和证书信息，因此没有执行上线、切流量或旧站删除。示例中的占位符必须按实际环境替换。

## 构建与预览

已有 node_modules 时，在前端仓库执行 `npm run build`，产物为 `dist/`。新构建机只有在获准下载依赖后才执行 `npm ci`，不用无锁定版本的安装替代。

本地用 `npm run preview` 查看构建产物，默认 4173，代理目标由 `.env.local` 的 BACKEND_URL 指定。Vite preview 是本地检查工具，不作为生产服务。

后端使用本人的已有 settings.xml 和本地仓库，离线编译/打包；若缓存缺失停止，不自动下载。生产使用 `prod` profile，配置 BLOG_DB_URL、BLOG_DB_USERNAME、BLOG_DB_PASSWORD；启动参数设置 `--spring.profiles.active=prod`。示例默认后端绑定 127.0.0.1:18080；跨服务器部署须调整绑定和代理访问范围。

生产 Cookie 的 Secure=true 需要通过 HTTPS 访问。不要在 HTTP 本地调试中直接使用 prod profile。默认阅读计数会写入 views；只读预览需同时设置 `--spring.datasource.hikari.read-only=true --blog.reading-count-enabled=false`，此时保存、评论及其事务加锁路径不可用。

## 发布顺序

1. 记录现有前端目录、后端 JAR、Nginx 配置及 Git 提交号，保留可回退版本。不要覆盖正在提供服务的整个目录。
2. 先发布兼容旧入口的新后端，再将本次 dist 完整放入新的版本目录。先用单独预览域名/入口验收，旧站保持原入口。
3. 参考 [Nginx 模板](../deploy/nginx.conf.example)，替换域名、证书、前端目录、后端地址。模板放在已有 http 上下文中，主配置保留 mime.types。`proxy_pass` 保留 `/api` 前缀，不能误配成后端 `/blogs`。
4. 切换前把上一版的 **带哈希 assets 文件**保留到新版本可访问的位置，避免已打开的页面继续请求旧懒加载文件时出现 404。只保留哈希资源，不覆盖新版 index.html、editor 或 vendor。
5. 在目标服务器执行 `nginx -t`，通过后再按实际服务管理方式加载配置。确认正式切换授权后，将 root/current 指向已验收的新版本。
6. 后续只改前端时重复构建、上传新目录、核验和切换目录的过程；接口兼容时无需更换后端。

## 发布验收

| 检查 | 期望 |
| --- | --- |
| 直接打开/刷新 `/blog/实际ID`、`/admin/blogs` | 页面正常；未登录后台转登录 |
| `/api/blogs/不存在的ID` | JSON 404，不能是 Vue HTML |
| `/assets/不存在.js`、`/images/不存在.png` | 真实 404，不能是首页 |
| 通过 HTTPS 登录、保存、退出 | Cookie 包含 HttpOnly/Secure/SameSite，CSRF 正常，退出后管理 API 401 |
| 新旧页面之间前进/后退、刷新 | 路由和筛选条件一致 |
| 仅前端发布 | Java PID 不变，新页面版本生效 |
| 切回保留的上一版目录 | 上一版页面恢复，API 仍兼容 |

API 不缓存；HTML、编辑器与未哈希资源重新验证；哈希 assets 长缓存。模板没有全局 `error_page 404 /index.html`，防止掩盖 API/静态资源错误。

## 回滚和旧站退役

前端回滚：将 root/current 指回原发布目录，必要时验证并加载 Nginx 配置；保留新旧哈希资源过渡一段时间。若后端不兼容则按已记录的对应 JAR 回退，重启会使本实例登录会话失效。本次未做 schema 变更，但生产发布仍应按数据库运维流程备份。

新站通过验收并稳定运行后，才将旧 IndexController、Thymeleaf 模板及无引用依赖作为独立清理任务；本次保留旧入口用于回退，不直接删除。正式切换、HTTPS、Nginx 配置加载和真实回滚尚未在目标服务器验证。

配置依据：[Nginx try_files](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)、[proxy_pass](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass)。
