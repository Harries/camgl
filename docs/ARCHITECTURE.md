# LiveCam Global — 系统技术架构文档（Next.js + Vercel + PostgreSQL）

> 版本：V1.0 | 适用阶段：MVP → V1.1 | 日期：2026-11-24
> 关联文档：[PRD.md](file:///Users/liuhaihua/IdeaProjects/camgl/docs/PRD.md)

---

## 1. 架构目标与选型原则

针对 MVP 阶段（300 个审核通过的直播点位、以 SEO 内容目录与官方播放器嵌入为核心、控制初期服务器与运维成本），本架构采用 **Next.js (App Router) + Vercel + 托管 PostgreSQL** 的全栈 Serverless 方案：

- **零运维上线**：利用 Vercel Edge CDN 与 Serverless Functions 自动扩缩容，专注业务与内容审核。
- **SEO 优先**：通过 Next.js RSC（React Server Components）+ ISR（Incremental Static Regeneration）输出完整 HTML，确保搜索引擎抓取效率与 Core Web Vitals 达标。
- **Serverless 适配**：Vercel 无常驻后台进程，因此将原规划中的“常驻 BullMQ Worker”调整为 **Vercel Cron Jobs + Upstash QStash（按需异步队列）**，待 V2/V3 自有推流或高频采集时再独立部署 Node.js Worker。
- **零视频带宽成本**：MVP 阶段只存储与分发元数据，视频流由 YouTube IFrame Player API 及授权官方 Embed 直接向用户终端提供。

---

## 2. 技术栈总览

| 层级 | 选型 | 说明 |
|---|---|---|
| **应用框架** | Next.js 15 (App Router) + TypeScript | 前后端一体（RSC + Server Actions + Route Handlers） |
| **UI 与样式** | Tailwind CSS + shadcn/ui | 响应式布局，移动端优先 |
| **部署与 CDN** | Vercel (Edge Network + Serverless) | 全球边缘缓存、预览环境、内置 Cron |
| **主数据库** | 托管 PostgreSQL（Neon 或 Supabase） | 支持连接池（PgBouncer）与分支环境，兼容 Serverless |
| **ORM** | Prisma ORM | 类型安全的数据访问与 Schema 迁移管理 |
| **缓存与限流** | Upstash Redis（HTTP REST） | 无连接池压力，用于天气缓存、地图缓存、API 限流 |
| **定时与异步任务** | Vercel Cron Jobs + Upstash QStash | 定时状态检测、关键词采集、失败退避重试 |
| **地图服务** | MapLibre GL JS + MapTiler / Protomaps | 合规瓦片服务与前端点位聚合 |
| **天气与昼夜** | `suncalc`（本地）+ Open-Meteo API | 昼夜/日出日落纯本地计算；天气按城市级缓存 30–60 分钟 |
| **后台鉴权** | Auth.js (NextAuth v5) | 仅管理后台使用，支持 OAuth/Passkey + RBAC |
| **安全防护** | Cloudflare Turnstile + CSP 白名单 | 防止公开提交/举报接口被刷，限制 Embed 域名 |
| **监控与统计** | Vercel Analytics + Sentry + GSC | 错误追踪、Core Web Vitals 监测、SEO 收录监控 |

---

## 3. 系统架构图

```mermaid
flowchart TD
    U[全球用户 / 搜索引擎爬虫] --> CDN[Vercel Edge Network / CDN]
    CDN --> NEXT[Next.js App Router<br/>RSC · ISR · Route Handlers]

    NEXT --> REDIS[(Upstash Redis<br/>天气/地图缓存 · 限流)]
    NEXT --> PG[(PostgreSQL<br/>Neon / Supabase + PgBouncer)]

    P[第三方官方播放器<br/>YouTube Embed / 授权源] -.->|客户端直接加载视频流| U

    CRON[Vercel Cron Jobs<br/>每 30 分钟触发] --> API_CRON[/api/cron/*<br/>CRON_SECRET 鉴权/]
    API_CRON --> QSTASH[Upstash QStash<br/>异步任务队列与重试]
    QSTASH --> API_WORK[/api/workers/*<br/>采集 · 批量检测 · 缓存刷新/]

    API_WORK --> YT[YouTube Data API v3]
    API_WORK --> WEATHER[Open-Meteo Weather API]
    API_WORK --> PG
    API_WORK --> REDIS

    ADMIN[管理员 / 审核员] --> NEXT
```

---

## 4. Next.js 项目目录结构

```text
src/
├── app/
│   ├── (public)/                      # C 端公开页面（SEO 索引主体）
│   │   ├── page.tsx                   # 首页（ISR 300s）
│   │   ├── countries/
│   │   │   ├── page.tsx               # 国家目录 /countries
│   │   │   └── [country]/
│   │   │       ├── page.tsx           # 国家详情 /countries/{country}
│   │   │       └── [city]/
│   │   │           └── page.tsx       # 城市目录 /countries/{country}/{city}
│   │   ├── categories/
│   │   │   └── [category]/page.tsx    # 分类目录 /categories/{category}
│   │   ├── webcams/
│   │   │   └── [slug]/page.tsx        # 直播详情页 /webcams/{slug}
│   │   ├── map/page.tsx               # 全球地图 /map
│   │   ├── random/page.tsx            # 随机直播（服务端重定向或动态选取）
│   │   ├── search/page.tsx            # 搜索页（noindex）
│   │   └── submit/page.tsx            # 商家/用户提交入口
│   ├── (admin)/
│   │   └── admin/                     # 管理后台（RBAC + MFA 保护，noindex）
│   │       ├── page.tsx               # 概览与 KPI
│   │       ├── candidates/page.tsx    # 候选池与审核台
│   │       ├── webcams/page.tsx       # 点位管理与状态监控
│   │       ├── jobs/page.tsx          # 采集任务与配额看板
│   │       └── reports/page.tsx       # 举报投诉与审计日志
│   ├── api/
│   │   ├── v1/
│   │   │   ├── webcams/route.ts       # GET 点位列表（分页/过滤）
│   │   │   ├── webcams/random/route.ts# GET 随机在线点位
│   │   │   ├── map/route.ts           # GET 地图 bbox 点位查询
│   │   │   ├── search/route.ts        # GET 搜索建议与结果
│   │   │   ├── submissions/route.ts   # POST 提交直播（Turnstile + 限流）
│   │   │   └── reports/route.ts       # POST 举报问题（Turnstile + 限流）
│   │   ├── admin/                     # 管理接口（校验 Session + ADMIN 角色）
│   │   └── cron/
│   │       ├── health-check/route.ts  # 定时批量检测直播状态
│   │       ├── discovery/route.ts     # 定时关键词采集发现
│   │       └── weather-sync/route.ts  # 定时同步城市天气缓存
│   ├── sitemap.ts                     # 动态 Sitemap（支持分片）
│   └── robots.ts                      # robots.txt 规则
├── components/
│   ├── player/                        # 播放器容器（延迟加载 + onError 降级）
│   ├── map/                           # MapLibre GL 封装与聚合控件
│   └── webcams/                       # 卡片、面包屑、天气/当地时间标签
└── lib/
    ├── db.ts                          # Prisma Client 单例（适配 Serverless）
    ├── redis.ts                       # Upstash Redis 客户端与限流器
    ├── youtube.ts                     # YouTube API 封装与配额控制
    ├── suncalc.ts                     # 经纬度本地昼夜/日出日落计算
    ├── weather.ts                     # 天气查询与 Redis 缓存
    └── seo.ts                         # Metadata、Canonical、JSON-LD 生成器
```

---

## 5. PostgreSQL 数据库与索引设计

### 5.1 Serverless 连接策略

Vercel Serverless Functions 每次冷启动可能创建新连接，必须配置双连接字符串：
- `DATABASE_URL`：指向 **PgBouncer 连接池**（Transaction Mode，供运行时查询使用）。
- `DIRECT_URL`：直连 PostgreSQL 实例（供 `prisma migrate deploy` 使用）。

### 5.2 核心状态分离与约束

遵循 PRD 规范，将**审核状态**与**流运行状态**严格解耦：
- `webcams.review_status`：`PENDING | APPROVED | REJECTED | SUSPENDED`
- `streams.status`：`LIVE | OFFLINE | SCHEDULED | RESTRICTED | UNKNOWN`
- **发布门槛**：公开页面与公开 API 仅查询 `review_status = 'APPROVED'` 且关联存在有效 `licenses` 记录的点位。

### 5.3 关键索引规划（MVP 阶段）

| 表名 | 索引 / 约束 | 用途 |
|---|---|---|
| `webcams` | `UNIQUE(slug)` | 固定点位 URL 资产，不随直播 ID 变更 |
| `webcams` | `INDEX(review_status, city_id)` | 加速国家/城市目录页过滤 |
| `webcams` | `INDEX(lat, lng)` | MVP 阶段（300–1,000 点位）直接通过 B-Box 范围查询，无需强依赖 PostGIS；万级点位时升级 PostGIS `GIST` 索引 |
| `streams` | `UNIQUE(source_type, external_id)` | 防止同一视频源重复入库 |
| `streams` | `INDEX(status, last_checked_at)` | 定时任务按“最久未检测”分批拉取 |
| `cities` | `UNIQUE(country_id, slug)` | 保证 `/countries/{country}/{city}` 路由唯一性 |
| `webcams` | `GIN (to_tsvector('english', title))` + `pg_trgm` | 支撑 `/search` 模糊与全文检索 |

---

## 6. 缓存、ISR 与 SEO 策略

### 6.1 页面渲染模式划分

| 路由 | 渲染模式 | 缓存策略 | 说明 |
|---|---|---|---|
| `/` 首页 | ISR (`revalidate = 300`) | Vercel Edge + `revalidateTag('webcams')` | 列表不自动加载视频，保证首屏 LCP ≤ 2.5s |
| `/countries/...`、`/categories/...` | ISR (`revalidate = 600`) | Edge Cache | 仅收录有效点位 ≥ 1 的页面，空页面返回 404/noindex |
| `/webcams/[slug]` | ISR (`revalidate = 300`) | Edge Cache + 客户端轻量化状态刷新 | 服务端输出完整介绍、天气摘要、BreadcrumbList |
| `/map`、`/search`、`/random` | Dynamic (`force-dynamic`) | Redis 缓存（60s–300s） | 搜索结果与带参过滤页默认 `noindex, follow` |
| `/admin/*` | Dynamic (`force-dynamic`) | 禁用缓存 (`no-store`) | 强制服务端鉴权 |

### 6.2 播放器性能与异常降级

1. **延迟加载（Facade Pattern）**：详情页首屏先渲染占位海报与播放按钮（或进入视口后初始化 IFrame），避免第三方播放器脚本阻塞主线程与影响 CLS。
2. **前端异常兜底**：监听 YouTube IFrame `onError`（如 `101`/`150` 禁止嵌入或地区屏蔽），立即展示友好提示、原始来源外链与同城市/同分类推荐点位，同时异步上报错误码。

---

## 7. 定时采集与 YouTube API 配额设计

YouTube Data API 默认免费配额为 **10,000 units/天**，在 Vercel Cron 体系下采用“低频发现 + 高频批量保活”策略：

| 任务 | 频率 | 接口与配额 | 每日估算消耗 |
|---|---|---|---|
| **全量状态检测** (`health-check`) | 每 30 分钟（48 次/天） | `videos.list`（每次批量传 50 个 ID = 1 unit；300 个点位每次需 6 units） | `48 × 6 = 288 units` |
| **频道新开播追踪** | 每 2 小时 | 优先轮询频道公开 RSS / `playlistItems.list`（1 unit/次） | `~200 units` |
| **关键词发现** (`discovery`) | 每日 2–4 次分批 | `search.list`（100 units/次），轮换种子词与国家 | `2,000–4,000 units` |
| **剩余安全余量** | — | 人工审核测试、重试与突发增量 | `~5,500 units` |

- **Cron 安全校验**：所有 `/api/cron/*` 接口必须校验请求头 `Authorization: Bearer ${process.env.CRON_SECRET}`，拒绝未授权调用。
- **超长任务拆分**：Vercel Hobby 单次函数超时为 10–60 秒（Pro 可达 300 秒）。`discovery` 或大批量更新通过 **Upstash QStash** 拆分为按批处理的子请求，避免单次超时。

---

## 8. 安全与合规设计

- **管理后台隔离**：`/admin/*` 与 `/api/admin/*` 通过 Middleware 与 Route Handler 双重校验 Session 角色（`ADMIN` / `MODERATOR`），所有写操作写入 `audit_logs`。
- **防 SSRF**：服务端绝不直接请求用户提交的任意 URL；`/submit` 提交的链接仅作格式校验与域名白名单检查，由人工在审核台核验。
- **公开接口防护**：`/api/v1/submissions` 与 `/api/v1/reports` 强制接入 Cloudflare Turnstile 人机验证 + Upstash Redis 滑动窗口限流（如每 IP 每分钟 5 次）。
- **CSP 策略**：在 `next.config.ts` 中配置 `Content-Security-Policy`，`frame-src` 仅允许 `https://www.youtube.com`、`https://www.youtube-nocookie.com` 及已备案的官方合作域名。
- **隐私数据隔离**：`providers.contact`、`licenses.evidence`、`submissions.contact` 等敏感字段严禁在任何公开 API 或 RSC Props 中序列化输出。

---

## 9. 环境变量清单

```env
# PostgreSQL (Neon / Supabase)
DATABASE_URL="postgresql://user:pass@pooler.region.aws.neon.tech/livecam?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@direct.region.aws.neon.tech/livecam"

# Upstash Redis & QStash
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
QSTASH_TOKEN=""
QSTASH_CURRENT_SIGNING_KEY=""
QSTASH_NEXT_SIGNING_KEY=""

# External APIs
YOUTUBE_API_KEY=""
MAPTILER_API_KEY=""

# Auth & Security
AUTH_SECRET=""
CRON_SECRET=""
TURNSTILE_SITE_KEY=""
TURNSTILE_SECRET_KEY=""
```

---

## 10. MVP 月度基础设施预算（Vercel + PG 方案）

| 服务 | 推荐套餐（MVP 初期） | 估算月费 |
|---|---|---:|
| **Vercel** | Hobby（验证期，注意非商业条款限制）或 **Pro**（正式商业运营推荐） | \$0 – \$20 / 月 |
| **PostgreSQL (Neon / Supabase)** | Free Tier（0.5GB–500MB）或 Pro（含自动备份与更高连接数） | \$0 – \$25 / 月 |
| **Upstash Redis + QStash** | Pay-as-you-go / Free Tier | \$0 – \$10 / 月 |
| **Sentry / 域名 / 瓦片额度** | Developer Free Tier | \$0 – \$10 / 月 |
| **合计** | — | **\$0 – \$65 / 月** |

> [!NOTE]
> 当平台流量增长至月访问量 50 万+ 或进入 **V3 自有推流（RTMPS/SRT）** 阶段时，流媒体服务器（SRS/MediaMTX + FFmpeg）与独立采集 Worker 需部署在独立云主机（如 AWS / Cloudflare / 阿里云），Vercel 仅继续承担前端与轻量 BFF 职责。
