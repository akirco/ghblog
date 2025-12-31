# Issues Blog

一个基于 Next.js App Router（TypeScript）的轻量级博客示例，包含用户认证、标签、帖子管理、图片上传与评论功能，适合作为个人项目或小型团队演示用的模板。

## 主要特性

- 账号认证（NextAuth 风格路由）
- 帖子 CRUD（支持草稿、发布、置顶/取消置顶）
- 标签管理与标签页浏览
- 图片上传接口（API 路由）
- 评论功能与评论区组件
- 基于组件化的 UI（components/ui 下常用控件）
- 使用 TypeScript + Next.js App Router

## 技术栈

- Next.js（App Router）
- TypeScript
- Node.js
- 数据存储：GitHub Issues + 仓库 contents（不依赖传统数据库）
- NextAuth（或自定义会话/认证实现，见 `lib/auth.ts`）

## 本地开发

先安装依赖并运行开发服务器：

```bash
bun install
bun run dev
```

常用脚本（在 `package.json` 中）：

- `dev` - 本地开发
- `build` - 生产构建
- `start` - 启动已构建的应用

## 本地调试要点

- 若使用 OAuth（如 GitHub），设置好回调地址并在 `.env` 中填写 client id/secret。
- 图片上传接口可能依赖外部存储或本地临时目录，请根据 `lib/image-utils.ts` 的实现调整。

## 部署建议

- 使用 Vercel、Netlify 或自托管（Docker）均可。若使用 Vercel，确保在项目设置中配置所有环境变量。

## 贡献与开发流程

欢迎贡献！建议遵循以下流程：

1. fork 仓库并新建分支
2. 提交可读的 commit 信息并打开 PR
3. 说明你修改的动机与如何复现（若修复 bug）

## 代码结构速览（重点文件）

- `components/editor.tsx` - 编辑/发布文章的富文本编辑器
- `components/comments-section.tsx` - 评论展示与提交
- `components/ui/` - 可复用 UI 组件库（按钮、卡片、弹窗等）
- `lib/auth.ts` - 会话/鉴权辅助
- `app/api/posts/` - 帖子相关 API 实现

## 联系方式

如需帮助或想要讨论功能，请打开 Issues 或直接联系仓库维护者。

## 许可

MIT License（根据项目实际选择并调整）。
