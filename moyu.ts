import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

export class MoyuClient {
  static get apiKey() {
    return process.env.MOYU_API_KEY || "";
  }

  static get imageApiKey() {
    return process.env.MOYU_IMAGE_API_KEY || this.apiKey;
  }

  static get baseUrl() {
    return "https://www.moyu.info/v1";
  }

  // 1. 文本生成 (默认走低成本大模型，如 gpt-3.5-turbo 兼容接口)
  static async generateText(prompt: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // 或者你平台上的超低成本模型 ID
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.choices[0].message.content;
  }

  // 2. 图像生成 (接入豆包 Seedream 图生图/文生图)
  static async generateImage(prompt: string): Promise<string> {
    
    // 如果 prompt 里包含图片 URL，自动触发图生图逻辑
    let imageUrl = undefined;
    let textPrompt = prompt;
    const urlMatch = prompt.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      imageUrl = urlMatch[0];
      textPrompt = prompt.replace(imageUrl, '').trim() || "融合图片风格";
    }

    const payload: any = {
      model: "doubao-seedream-5-0-260128", // 推荐的 5.0 模型
      prompt: textPrompt,
      size: "2K",
      output_format: "png",
      response_format: "url" // Seedream 默认支持直接返回 URL，非常方便
    };

    // 智能挂载参考图
    if (imageUrl) {
      payload.image = imageUrl;
    }

    const res = await fetch(`${this.baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.imageApiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    
    // Seedream 直接返回 CDN 链接
    if (data.data && data.data[0] && data.data[0].url) {
      return data.data[0].url;
    }
    
    throw new Error("图片生成响应格式异常");
  }

  // 3. 视频任务提交
  static async submitVideoTask(prompt: string, imageUrl?: string): Promise<string> {
    const payload: any = {
      model: "doubao-seedance-2-0-260128", // 根据网关实际可用的真实模型 ID 替换
      prompt: prompt,
      duration: 5,
      generate_audio: false
    };

    if (imageUrl && imageUrl.startsWith('http')) {
      payload.images = [imageUrl];
    }

    const res = await fetch(`${this.baseUrl}/video/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.task_id;
  }

  // 4. 视频任务轮询
  static async pollVideoTask(taskId: string): Promise<{status: 'pending'|'success'|'failed', url?: string}> {
    const res = await fetch(`${this.baseUrl}/video/generations/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`
      }
    });
    
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    const data = json.data;

    if (data.status === "SUCCESS") {
      return { status: "success", url: data.result_url };
    } else if (data.status === "FAILURE") {
      return { status: "failed" };
    } else {
      return { status: "pending" };
    }
  }
}
