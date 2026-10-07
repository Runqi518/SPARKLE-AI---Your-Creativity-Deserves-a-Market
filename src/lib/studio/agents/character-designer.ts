import type { AgentDefinition } from "./types";

export const definition: AgentDefinition = {
  "id": "character-designer",
  "name": "Character Designer",
  "dependencies": [
    "creative-director",
    "scriptwriter"
  ],
  "purpose": "建立广告中人物的角色设定与跨镜头连续性规范。",
  "inputs": [
    "人物需求、品牌受众与脚本动作",
    "可用人物描述、授权或身份约束"
  ],
  "steps": [
    "判断是否需要人物；纯产品广告可交付不使用人物的方案并说明理由。",
    "定义人物职能、年龄范围、气质和表达风格，避免冒充真实人物。",
    "锁定外观、服饰、道具及动作习惯的连续性锚点。",
    "根据脚本设计表演、手势、表情和不同景别的角色参考要求。",
    "写出角色生成提示词及需确认的参考条件。"
  ],
  "sections": [
    {
      "key": "character",
      "title": "角色设定",
      "requirement": "角色用途、外观、服饰、道具或无需人物的决定。"
    },
    {
      "key": "performance",
      "title": "表演指令",
      "requirement": "动作、表情、语气与镜头间连续性锚点。"
    },
    {
      "key": "references",
      "title": "角色参考方案",
      "requirement": "角色提示词、参考图需求、不可改变特征。"
    }
  ],
  "checks": [
    "不默认使用真实个人身份或未经确认的代言。",
    "同一人物的关键特征应可复用。",
    "不凭空声称已检验素材中的人物一致性。"
  ]
};
