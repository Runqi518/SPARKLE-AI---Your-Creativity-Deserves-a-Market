import type { AgentDefinition } from "./types";

export const definition: AgentDefinition = {
  "id": "storyboard-designer",
  "name": "Storyboard Designer",
  "dependencies": [
    "creative-director",
    "scriptwriter",
    "product-visual-designer",
    "character-designer",
    "scene-designer"
  ],
  "purpose": "把脚本和视觉规范整合成按顺序可执行的分镜与镜头生成计划。",
  "inputs": [
    "脚本、时长与创意方向",
    "产品、角色和环境规范或用户提供的替代资料"
  ],
  "steps": [
    "把脚本拆为连续镜头，给每个镜头稳定编号。",
    "确定起止时间、景别、机位、运镜、主体动作、构图与转场。",
    "把已选岗位交付的产品、人物、场景约束写入对应镜头。",
    "逐镜头写生成提示词和所需参考素材，注明尚缺少的资料。",
    "核对镜头总时长、动作连贯与字幕、旁白的对应关系。"
  ],
  "sections": [
    {
      "key": "shots",
      "title": "分镜清单",
      "requirement": "镜头编号、时间、景别、机位、运镜、动作、屏幕文字和转场。"
    },
    {
      "key": "prompts",
      "title": "镜头生成规划",
      "requirement": "逐镜头提示词、参考素材与连续性约束。"
    },
    {
      "key": "continuity",
      "title": "连续性检查",
      "requirement": "时长合计、叙事连贯与尚需修正的镜头。"
    }
  ],
  "checks": [
    "各镜头起止时间连续且与总时长一致。",
    "读取前序视觉规范，不随意改变产品或角色。",
    "交付镜头计划，不声称已渲染视频。"
  ]
};
