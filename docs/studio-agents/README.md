# Sparkle Agents

8 个独立的岗位工作流，每个岗位有自己的目标、输入要求、执行步骤、交付格式与检查项。岗位定义在 `src/lib/studio/agents/`，不引用 skills 定义。

| Agent | 独立交付 |
| --- | --- |
| [Creative Director](creative-director.md) | 创意简报、方向取舍、制作任务与验收条件 |
| [Scriptwriter](scriptwriter.md) | 开场候选、分段脚本、旁白与 CTA 文案 |
| [Product Visual Designer](product-visual-designer.md) | 产品外观规范、主视觉和细节方案、产品提示词 |
| [Character Designer](character-designer.md) | 角色设定、表演指令、角色参考与连续性约束 |
| [Scene Designer](scene-designer.md) | 环境与道具、布光和色调、场景提示词 |
| [Storyboard Designer](storyboard-designer.md) | 带时间码的分镜、镜头提示词、连续性检查 |
| [Sound Director](sound-director.md) | 配音指导、音乐与音效时间线、混音建议 |
| [Final Editor](final-editor.md) | 剪辑时间线、字幕与版式、导出及验收方案 |

## 执行方式

通过顶部 Add agent 选择团队并发送请求后，后端创建持久化任务，立即返回 `202`。后台按岗位依赖顺序执行，每个已选择岗位独立调用一次文本模型，只接收原始简报和自己声明的、已选择且成功完成的前序岗位结果。未选择的岗位不会自动运行。通过顶部 skills 加号选择技能后使用独立的 `/api/studio/skills/run` 接口，不启动 agent；两个接口拒绝混合提交。输入框按最近使用的团队或技能选择入口确定执行类型，并随对话保存；不再显示底部 Agents / Skills 切换栏。

每个岗位返回结构化 JSON：`status`、`summary`、自己的 `sections`、`assumptions`、`questions`。后端验证 JSON、大小、交付章节及必要问题后，才把结果交给后续岗位。模型按该岗位工作流自检内容；格式校验不等于事实或广告效果验证。

- 岗位状态：queued → running → succeeded / needs_input / failed；有未成功依赖时标记 blocked。
- 缺少关键输入时列出问题并暂停依赖岗位；用户补充信息后发送新的请求。不会自动猜测或偷偷重试。
- 失败只阻断依赖该岗位的工作；无该依赖的岗位继续执行，已完成产出保留。
- 每次提交携带唯一 `requestId`。重试同一请求会返回已有任务；同 ID 不同内容返回 `409`。重复点击或后台重复调度不重复提交模型。
- SQLite 保存任务、原始上下文快照、逐岗位状态和产出。刷新后恢复状态；读取记录不会重新运行模型。
- 服务中断或超时最终标记失败，迟到结果不会覆盖终态；模型配置变化会终止后续调用。
- 界面逐岗位显示状态与可展开交付，完成的产出可分别添加到画布。

## 接口

- `GET /api/studio/agents`：8 个岗位的完整定义。
- `POST /api/studio/assist`：`requestId`、`projectId`、`prompt`、`agents`（名称数组）、可选 `context` 与 `history`；返回 `{run}`。
- `GET /api/studio/assist?projectId=...`：项目最近 30 条运行记录。
- `GET /api/studio/assist/:id`：逐岗位状态、结果和错误。
- `POST /api/studio/skills/run`：`prompt`、`skills`、可选 `context` 与 `history`；返回 `{content}`。

需要配置文本模型才能实际执行。当前 agent 的工具能力是文本模型调用：产出脚本、视觉提示词、分镜、声音或剪辑计划。图片、视频仍通过画布生成节点执行；没有新增音频合成、视频剪辑或发布工具。仅提供素材 URL 时不会自动读取图片或视频内容，不能把制作计划宣称为已生成成片。

## 验证

`node --test tests/studio-providers.mjs` 使用临时 SQLite 和回环模拟模型，验证 8 次独立调用、依赖交接、分离 skills、输入与输出校验、失败和缺项处理、幂等提交、任务恢复与迟到结果保护。模拟模型验证调用链和契约，不代表真实模型的创意质量。
