import type { AgentDefinition } from "./types";

export const definition: AgentDefinition = {
  "id": "scene-designer",
  "name": "Scene Designer",
  "dependencies": [
    "creative-director",
    "scriptwriter"
  ],
  "purpose": "为广告建立环境、布光、色调和场景连续性方案。",
  "inputs": [
    "创意方向、脚本场景与画面需求",
    "地点描述、产品环境和品牌配色"
  ],
  "steps": [
    "从脚本提取场景与时间变化，减少不必要的场景切换。",
    "定义每个环境的空间关系、背景元素、道具与产品位置。",
    "设计主光、辅光、光向、色温意图、整体色调与氛围。",
    "说明跨镜头要锁定的背景和光线条件。",
    "输出逐场景提示词与搭建或拍摄注意事项。"
  ],
  "sections": [
    {
      "key": "environments",
      "title": "场景设定",
      "requirement": "各环境的空间、道具、时间和主体摆放。"
    },
    {
      "key": "lighting",
      "title": "光线与色调",
      "requirement": "布光意图、光向、色调及连续性要求。"
    },
    {
      "key": "prompts",
      "title": "场景生成提示词",
      "requirement": "逐场景提示词与搭建注意事项。"
    }
  ],
  "checks": [
    "道具和场景不得遮挡产品核心信息。",
    "色调与品牌约束一致。",
    "无法确定的实际地点、拍摄条件应标记为建议。"
  ]
};
