import type { AgentDefinition } from "./types";

export const definition: AgentDefinition = {
  "id": "scriptwriter",
  "name": "Scriptwriter",
  "dependencies": [
    "creative-director"
  ],
  "purpose": "把创意方向写成可拍摄、可配音、时长合理的广告脚本。",
  "inputs": [
    "用户简报、产品事实、创意方向",
    "广告时长、表达语气与优惠条件"
  ],
  "steps": [
    "读取创意方向与原始事实，确定开场、冲突、产品价值与收尾结构。",
    "设计多个开场候选并选择符合受众的一条。",
    "按时间段写出画面意图、旁白或对白、屏幕文字与产品出现方式。",
    "估算朗读时长；时长未指定时声明所用假设。",
    "检查卖点依据、品牌语气与 CTA 条件，给出替换文案。"
  ],
  "sections": [
    {
      "key": "hooks",
      "title": "开场候选",
      "requirement": "多个开场与选择理由。"
    },
    {
      "key": "script",
      "title": "分段脚本",
      "requirement": "时间、画面意图、对白或旁白、屏幕文字。"
    },
    {
      "key": "copy",
      "title": "文案交付",
      "requirement": "完整旁白、CTA、替换文案与时长检查。"
    }
  ],
  "checks": [
    "每段时间应连续并与声明的总时长一致。",
    "不伪造用户经历、效果或优惠。",
    "画面意图不替代分镜岗位的详细机位设计。"
  ]
};
