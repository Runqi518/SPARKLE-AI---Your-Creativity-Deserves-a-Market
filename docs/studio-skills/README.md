# Sparkle Studio Skills

共 16 个 skills：原有 4 个，加上新设计的 12 个。Agent 列表保留 8 个。

在 AI Studio Partner 顶部点击 skills 加号，选中 skill 并发送请求后，后端会将其完整输入要求、执行步骤、输出要求和质量检查加入文本模型的系统指令。多个 skills 可以同时使用，重复选择不会重复注入。重新使用 Add agent 入口即可返回团队执行，两个工作流保持独立。

这些工作流产出文本、创作计划、检查结果和提示词。图片或视频生成继续通过画布的生成节点执行。只提供素材链接时，文本模型不会自动读取视频帧或分析图片；依赖用户提供的描述与资料。

## 新增 Skills

- [Audience & Hook Strategy](audience-hook-strategy.md) — 把受众需求、真实产品价值和广告目标转化为可测试的创意角度与开场钩子。
- [UGC Ad Writer](ugc-ad-writer.md) — 生成自然、便于创作者拍摄的用户分享型广告脚本，保留清晰的产品价值与行动方向。
- [Product Demo Planner](product-demo-planner.md) — 把抽象产品功能转化为可拍摄、可理解、可验证的演示动作。
- [Shot List Builder](shot-list-builder.md) — 将广告脚本拆成可交给拍摄或生成流程使用的逐镜头清单。
- [Visual Consistency Check](visual-consistency-check.md) — 基于用户提供的描述、文本标注或已观察到的资料，检查跨镜头视觉连续性。
- [Platform Format Adapter](platform-format-adapter.md) — 将同一广告内容改写为适合不同投放位置的画面、节奏和文字版本。
- [CTA & Offer Writer](cta-offer-writer.md) — 把广告目标和真实优惠信息写成简洁、具体、条件完整的行动号召。
- [Brand Voice Adapter](brand-voice-adapter.md) — 在保留事实和表达目的的基础上，把文案改写为一致的品牌语气。
- [Compliance & Claims Review](compliance-claims-review.md) — 筛查广告中可能缺乏依据、存在误导或需要进一步审核的宣传表达。
- [Accessibility Pass](accessibility-pass.md) — 让广告在不同观看条件下更容易阅读和理解，尤其关注字幕和无声观看。
- [Creative Variant Generator](creative-variant-generator.md) — 围绕同一简报生成有实质差异、可比较和可测试的广告创意路线。
- [Ad Performance Review](ad-performance-review.md) — 依据用户提供的真实投放数据诊断素材表现，并提出可执行的下一轮测试计划。

## 原有 Skills

- [Reference breakdown](reference-breakdown.md) — 拆解用户提供的参考描述，提取可复用的节奏、镜头结构和表达方式。
- [Motion graphics](motion-graphics.md) — 规划可编辑的文字、数据与图形动画。
- [Caption polish](caption-polish.md) — 提高字幕和画面短文案的清晰度、长度适配与品牌一致性。
- [Brand check](brand-check.md) — 对照品牌简报检查广告文案和创意方向。

## 实现位置

- 选单定义：`src/lib/studio/capabilities.ts`
- 完整执行指令：`src/lib/studio/skill-instructions.ts`
- 执行入口：`POST /api/studio/skills/run`
- 定义查询：`GET /api/studio/skills`

Skills 接口只接受 skill，不接受 agent；只注入已选择的技能。Agent 通过独立接口和逐岗位任务执行，详见 [Agent 工作流](../studio-agents/README.md)。所有必需数据缺失时应标明缺项或请求补充，不能虚构事实。本文档由代码定义生成，修改执行指令后应同步更新。
