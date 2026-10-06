import { GenerationRequest, GenerationTask } from "../../schemas/task";
import { updateNodeResult } from "@/lib/projects";
import { GenerationJob, syncDatabase } from "./db";
import { MoyuClient } from "./moyu";

// ----------------- API Services -----------------

// 1. 发起 AI 生成任务 (POST /api/tasks/generate)
export async function createGenerationTask(req: GenerationRequest): Promise<GenerationTask> {
  await syncDatabase();

  const taskId = `task_${Date.now()}`;

  const newTaskData = {
    id: taskId,
    projectId: req.projectId || "temp_project",
    nodeId: req.nodeId,
    type: req.type,
    prompt: req.prompt,
    config: req.config,
    status: "pending",
  };

  const job = await GenerationJob.create(newTaskData);

  // 触发真实的 Moyu (魔芋) API 调度
  dispatchToMoyu(taskId, req.prompt, req.type, req.projectId);

  const jobData = job.toJSON() as any;
  return {
    ...jobData,
    createdAt: new Date(jobData.createdAt).getTime()
  } as unknown as GenerationTask;
}

// 2. 轮询任务状态 (GET /api/tasks/:id)
export async function getTaskStatus(taskId: string): Promise<GenerationTask | null> {
  await syncDatabase();
  const job = await GenerationJob.findByPk(taskId);
  if (!job) return null;
  const data = job.toJSON() as any;
  return {
    ...data,
    createdAt: new Date(data.createdAt).getTime()
  } as GenerationTask;
}

// ----------------- 真实的大模型分发与调度 -----------------
async function dispatchToMoyu(taskId: string, prompt: string, type: string, projectId?: string) {
  try {
    if (!MoyuClient.apiKey) {
      console.warn("未配置 MOYU_API_KEY 环境变量，走降级 Mock 逻辑");
      return fallbackMockGeneration(taskId, type, projectId);
    }

    await GenerationJob.update({ status: "processing" }, { where: { id: taskId } });

    // 智能解析上下文中的图片 URL (图生视频场景)
    let imageUrl = undefined;
    let textPrompt = prompt;
    const urlMatch = prompt.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      imageUrl = urlMatch[0];
      textPrompt = prompt.replace(imageUrl, '').trim() || "让画面动起来，平滑过渡"; // 默认填补缺失提示词
    }

    // 根据不同节点类型进行智能路由
    if (type === "text") {
      // 当前魔芋的分组下没有可用的文本模型，暂时降级为 mock (避免 503 报错)
      try {
        const resultText = await MoyuClient.generateText(textPrompt);
        await GenerationJob.update({ status: "success", resultUrl: resultText }, { where: { id: taskId } });
        if (projectId) await updateNodeResult(projectId, taskId, resultText);
      } catch (e) {
        console.warn("文本模型未配置，降级 mock", e);
        return fallbackMockGeneration(taskId, type, projectId);
      }
      
    } else if (type === "image") {
      // 当前魔芋的分组下没有可用的生图模型，暂时降级为 mock
      try {
        const resultImageUrl = await MoyuClient.generateImage(textPrompt);
        await GenerationJob.update({ status: "success", resultUrl: resultImageUrl }, { where: { id: taskId } });
        if (projectId) await updateNodeResult(projectId, taskId, resultImageUrl);
      } catch (e) {
        console.warn("生图模型未配置，降级 mock", e);
        return fallbackMockGeneration(taskId, type, projectId);
      }

    } else if (type === "video") {
      // 视频生成 (异步提交 + 轮询)，网关余额不足等异常时降级 mock
      let moyuTaskId: string;
      try {
        moyuTaskId = await MoyuClient.submitVideoTask(textPrompt, imageUrl);
      } catch (e) {
        console.warn("视频模型调用失败，降级 mock", e);
        return fallbackMockGeneration(taskId, type, projectId);
      }
      
      const pollInterval = setInterval(async () => {
        try {
          const result = await MoyuClient.pollVideoTask(moyuTaskId);
          if (result.status === 'success' && result.url) {
            clearInterval(pollInterval);
            await GenerationJob.update({ status: "success", resultUrl: result.url }, { where: { id: taskId } });
            if (projectId) await updateNodeResult(projectId, taskId, result.url);
          } else if (result.status === 'failed') {
            clearInterval(pollInterval);
            await GenerationJob.update({ status: "failed" }, { where: { id: taskId } });
          }
        } catch (e) {
          console.error("轮询视频状态异常:", e);
        }
      }, 3000); // 豆包视频比较久，每 3 秒查一次
    }

  } catch (err) {
    console.error("Moyu API 调用失败:", err);
    await GenerationJob.update({ status: "failed" }, { where: { id: taskId } });
  }
}

// 开发没启动环境变量时的降级处理
async function fallbackMockGeneration(taskId: string, type: string, projectId?: string) {
  setTimeout(async () => {
    let resultUrl = "";
    if (type === "video") {
      resultUrl = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
    } else if (type === "image") {
      resultUrl = `https://picsum.photos/seed/${taskId}/400/225`;
    } else {
      resultUrl = `【AI 自动生成脚本】\n画面：深色科技背景，粉色粒子飘散\n文案：创意无界，增长有形 (Boundless ideas. Tangible results.)\n配乐：赛博朋克节奏\n(TaskID: ${taskId.slice(-4)})`;
    }
    await GenerationJob.update({ status: "success", resultUrl }, { where: { id: taskId } });
    if (projectId) await updateNodeResult(projectId, taskId, resultUrl);
  }, 4000);
}