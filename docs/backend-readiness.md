# Sparkle 后端运行与接入说明

本轮保持现有 CSS、颜色、素材和页面布局，补齐数据持久化、权限、队列与商业订单。以下区分已经实现的代码与需要真实供应商才能完成的验收。

## 已实现

- SQLite 持久化：Projects、Canvases、Subjects、Workspace（示例画布）、素材库、模板及版本、聊天、生成任务、Agent 运行、Skill 运行、订单、委托、用户、会话、调用额度、支付事件、钱包流水、提现与模板授权。所有业务数据带 ownerId；共享市场仅显式返回已发布内容。
- 画布与聊天按 revision 保存，拒绝旧版本覆盖；画布检查重复节点、无效连线、环路及数量限制。项目与画布、委托与订单均使用事务。
- 素材上传校验真实格式、图片解码与大小，存放在私有目录，通过权限检查或短期签名读取。删除素材库条目不会立即破坏仍被画布引用的文件。网络导入拒绝私网地址、锁定 DNS 解析结果、禁止重定向并限制下载时长与大小。
- 生成任务、Agent 任务和 Skill 结果存入数据库，重复 requestId 不重复执行。恢复排队任务；无法确认是否计费的运行任务不会自动重新提交。后台取消本地等待无法保证供应商停止计费。
- 8 个 Agent 保留独立角色、输入要求、执行步骤和输出约束；Skills 独立执行。图片进入文字模型视觉输入；本地视频抽取关键帧。远程视频需要供应商原生支持或先导入。
- FFmpeg 实际 MP4 导出：图片、视频、视频原声、独立音轨和 Captions 字幕，白色底，最多 30 个视觉片段、120 秒，720p/1080p。JSON 工程导出仍保留。
- 商家发布有金额的 bounty → 创作者领取 → 交付 → 商家修改/验收 → 支付回调确认收益。商家只能访问交付文件，不能访问创作者私有画布。每个 bounty 当前只允许一条委托，取消后不自动重新开放。
- 模板价格以服务器为准，订单保留购买时的模板快照；支付成功后通过 Orders 的 Use template 应用到空画布。回调验签、幂等入账、退款冲销、提现预占与失败释放已实现；外部手工收款记录不能成为可提现余额。
- 浏览器旧素材、模板和订单首次迁移到服务器。素材、模板失败操作保留本地待同步日志；画布和技能请求保留恢复记录。多标签保存冲突会明确提示，避免静默覆盖。

## 启动与检查

```sh
npm ci
cp .env.example .env.local  # 仅首次；已有配置请保留
npm run db:migrate
npm run build
npm start -- --port 3002
```

`npm start` 先执行非破坏性迁移，再启动 Next 与数据库队列恢复。`npm run dev` 也在服务器启动时初始化数据库，但仅生产 start 或独立 worker 提供持续恢复轮询。直接运行 `next start` 需要另开 `npm run worker`。部署需要长期 Node 进程及持久磁盘；不要放在会清空本地磁盘的无状态函数上。FFmpeg/FFprobe 需要服务器安装；可使用环境变量指定路径。

```sh
npm test
npm run typecheck
npm run lint
npm run db:backup
npm run media:gc
npm run db:restore -- /absolute/path/to/backups/TIMESTAMP
```

备份包含一致的 SQLite 快照与私有素材。恢复命令写入新的 `data/restored-TIMESTAMP`，不覆盖当前数据库；停止服务器后将命令输出的数据库与 uploads 路径设为 SPARKLE_DATABASE_PATH、SPARKLE_MEDIA_PATH，再重启。建议停止写入后执行备份，确保数据库快照与素材快照同一业务时点。迁移添加旧表字段前也会自动备份数据库。GC 仅删除超过 7 天且没有业务引用的媒体文件。运行中的进程需要共享数据库和媒体路径；不要同时执行迁移。

`GET /api/health` 检查数据库连接与配置状态，不返回密钥。默认本机模式绑定 127.0.0.1，仅用于个人电脑；对公网开放必须改为 accounts 模式、HTTPS 并创建账号。第一个账号继承现有个人数据，默认禁止后续注册，需要时显式开启 SPARKLE_ALLOW_REGISTRATION。密码使用 scrypt，会话只保存 token 哈希，Cookie 为 HttpOnly/SameSite=Strict。反向代理应保留真实请求 origin；不要把本机模式暴露到公网。

## 真实 API 接入仍需完成的部分

文字、图片和视频配置见 `.env.example` 与 `docs/generation-providers.md`。供应商协议、图像尺寸枚举、视频轮询状态、原生视频理解必须按最终供应商确认；通用请求模板不能保证任意服务直接兼容。密钥只放服务器环境变量。每天的调用次数限制已经实现，货币成本上限需要供应商价格信息，当前不推测费用。

支付代码当前使用规范化网关协议，**不是 Stripe、支付宝、微信等原生 SDK 适配器**。必须选择支付/提现服务，并由供应商适配层提供下面的接口与签名回调。没有配置时不会创建真实收款或提现。自动投放、投放数据回流、团队实时协作、原生视频编辑器、音乐/TTS 生成不属于本轮已实现能力；Agent 可提供规划与结构化内容，不能把它们描述成已经自动执行的媒体工具。

### 支付网关合同

- HTTPS `POST BASE_URL/checkout`：Bearer API_KEY，Idempotency-Key 为本地 payment.id；JSON 含 id、orderId、sellerId、amountCents、currency:USD。返回 `{id,url}`，url 必须 HTTPS；供应商回跳应指向 `/commercial/orders`，回跳本身不确认付款。
- HTTPS `POST BASE_URL/payout`：相同认证/幂等头；JSON 含 id、amountCents、currency:USD、destinationId。destinationId 应是供应商验证并绑定到该用户的收款对象，适配器必须核对其归属与 KYC；客户端字符串不代表已经验证的银行账户。
- `POST /api/payments/webhook`：请求头 `x-sparkle-timestamp`（Unix 秒）、`x-sparkle-signature`（HMAC-SHA256(secret, timestamp + '.' + 原始 JSON)）；允许 5 分钟偏差。JSON `{id,type,objectId,amountCents,currency:'USD'}`，objectId 为本地 payment/payout id。type 为 payment.succeeded、payment.failed、payment.refunded、payout.succeeded、payout.failed。
- 出站超时或返回不确定时保留 submitting，禁止生成新的扣款。适配器需要通过同一幂等 ID 查询供应商并补发已验签的终态事件；本仓库没有供应商查询凭据，因此不能替代真实对账。

因此：本地前后端及数据库可以运行；真正的付费生成、收款、退款和提现仍须配置选定服务，并用该服务的沙盒及真实凭据分别验收。不能仅凭本地测试宣布商业上线完成。
