
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

  // 1. Text generation (defaults to a low-cost model through a compatible endpoint)
  static async generateText(prompt: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Or a low-cost model ID available on your platform
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.choices[0].message.content;
  }

  // 2. Image generation (Seedream image-to-image/text-to-image)
  static async generateImage(prompt: string): Promise<string> {
    
    // An image URL in the prompt activates image-to-image generation
    let imageUrl = undefined;
    let textPrompt = prompt;
    const urlMatch = prompt.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      imageUrl = urlMatch[0];
      textPrompt = prompt.replace(imageUrl, '').trim() || "Blend the image style";
    }

    const payload: Record<string, unknown> = {
      model: "doubao-seedream-5-0-260128", // Recommended 5.0 model
      prompt: textPrompt,
      size: "2K",
      output_format: "png",
      response_format: "url" // Seedream supports direct URL responses
    };

    // Attach the reference image
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
    
    // Seedream returns CDN URLs directly
    if (data.data && data.data[0] && data.data[0].url) {
      return data.data[0].url;
    }
    
    throw new Error("Invalid image generation response format");
  }

  // 3. Submit a video job
  static async submitVideoTask(prompt: string, imageUrl?: string): Promise<string> {
    const payload: Record<string, unknown> = {
      model: "doubao-seedance-2-0-260128", // Replace with an actual model ID available through the gateway
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

  // 4. Poll the video job
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
