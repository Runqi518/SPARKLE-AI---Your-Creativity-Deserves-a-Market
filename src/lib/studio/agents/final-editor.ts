import type { AgentDefinition } from "./types";

export const definition: AgentDefinition = {
  "id": "final-editor",
  "name": "Final Editor",
  "dependencies": [
    "creative-director",
    "scriptwriter",
    "product-visual-designer",
    "character-designer",
    "scene-designer",
    "storyboard-designer",
    "sound-director"
  ],
  "purpose": "整合已完成的岗位交付，形成剪辑时间线、字幕和导出检查方案。",
  "inputs": [
    "已有脚本、分镜、声音与视觉方案",
    "素材可用情况、画幅、时长和交付目的"
  ],
  "steps": [
    "盘点可用素材与方案，区分已存在素材、计划生成素材与缺项。",
    "创建镜头顺序、入出点、转场、旁白与音乐对应的剪辑时间线。",
    "整理字幕文案、出现时刻、层级与可读性规则。",
    "检查产品、角色、场景、声音及 CTA 的一致性，列出修改优先级。",
    "给出画幅、时长、编码等导出建议和最终验收清单，未配置剪辑工具时明确交付为计划。"
  ],
  "sections": [
    {
      "key": "timeline",
      "title": "最终剪辑时间线",
      "requirement": "镜头顺序、时间、转场、声音及素材缺项。"
    },
    {
      "key": "captions",
      "title": "字幕与版式",
      "requirement": "字幕文本、时间、层级、安全区和可读性规则。"
    },
    {
      "key": "delivery",
      "title": "交付检查",
      "requirement": "连续性问题、修改优先级、导出建议和验收清单。"
    }
  ],
  "checks": [
    "不可把规划素材描述为已完成素材。",
    "所有时间与最终广告时长对应。",
    "不能声称已导出、上传或发布成片。"
  ]
};
