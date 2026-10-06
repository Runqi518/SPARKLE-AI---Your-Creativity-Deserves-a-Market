"use client";

import { useState, useEffect } from "react";
import { Play, Image as ImageIcon, Video, Type, Sparkles, Loader2, Link as LinkIcon } from "lucide-react";
import { NodeProps, Handle, Position, useReactFlow, useEdges, useNodes } from "@xyflow/react";

export const CustomNode = ({ id, data }: NodeProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string>(String(data.resultUrl || ""));
  const [prompt, setPrompt] = useState("");
  
  // 用于更新全局画布数据
  const { updateNodeData } = useReactFlow();
  const edges = useEdges();
  const nodes = useNodes();

  // 核心业务逻辑：当上游节点连入时，自动获取上游的生成结果作为前置上下文
  const parentNodeIds = edges.filter(e => e.target === id).map(e => e.source);
  const parentNodes = nodes.filter(n => parentNodeIds.includes(n.id));
  const parentOutputs = parentNodes
    .map(n => n.data?.resultUrl)
    .filter(Boolean)
    .join("\n\n---\n\n"); // 组合多个父节点的输出

  // 监听父节点的数据变化，如果当前提示词为空，则自动填充
  useEffect(() => {
    if (parentOutputs && !prompt) {
      setPrompt(parentOutputs);
    }
  }, [parentOutputs]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/tasks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
          projectId: String(data.projectId || ""),
          nodeId: id,
          type: data.type || "image",
          prompt,
        }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.task) {
        alert(resData.error || "生成请求失败，请稍后重试");
        setIsGenerating(false);
        return;
      }
      const { task } = resData;

      const pollTask = async (taskId: string) => {
        const statusRes = await fetch(`/api/tasks/${taskId}`);
        const statusData = await statusRes.json();

        if (!statusData.task) {
          setIsGenerating(false);
          alert("任务状态查询失败，请刷新重试");
          return;
        }

        if (statusData.task.status === "success") {
          const newResult = statusData.task.resultUrl;
          setResultUrl(newResult);
          updateNodeData(id, { resultUrl: newResult }); // 关键：更新到全局画布状态，让下游节点能读到！
          setIsGenerating(false);
        } else if (statusData.task.status === "failed") {
          setIsGenerating(false);
          alert("生成失败");
        } else {
          setTimeout(() => pollTask(taskId), 1000);
        }
      };
      pollTask(task.id);
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
    }
  };

  return (
    <div className="glass-black rounded-2xl p-5 min-w-[280px] max-w-[320px] relative group shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-white/10 hover:border-pink-500/50 transition-colors">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none rounded-2xl" />
      
      {/* 强化版连接点：更大的点击区域，更高的层级，带十字光标 */}
      <Handle 
        id="target"
        type="target" 
        position={Position.Left} 
        className="!w-4 !h-4 !bg-pink-500 !border-2 !border-black !-ml-2 z-50 transition-transform hover:scale-125 cursor-crosshair shadow-lg" 
      />
      
      <div className="font-medium tracking-widest mb-4 flex items-center justify-between text-white/90 text-sm relative z-10">
        <div className="flex items-center gap-2">
          {data.type === 'image' && <ImageIcon className="w-4 h-4 text-pink-300" />}
          {data.type === 'video' && <Video className="w-4 h-4 text-blue-300" />}
          {data.type === 'text' && <Type className="w-4 h-4 text-purple-300" />}
          {data.type === 'ai' && <Sparkles className="w-4 h-4 text-yellow-300" />}
          {String(data.label)}
        </div>
        {parentNodes.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
            <LinkIcon className="w-3 h-3" />
            已关联上游
          </div>
        )}
      </div>
      
      {!resultUrl && !isGenerating && (
        <div className="space-y-3 relative z-10">
          <textarea 
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="w-full text-xs p-3 glass-silver bg-black/40 rounded-xl focus:outline-none focus:border-pink-500/80 focus:ring-1 focus:ring-pink-500/50 placeholder:text-white/20 font-light resize-none transition-all shadow-inner" 
            rows={4} 
            placeholder={parentNodes.length > 0 ? "已自动填入上游结果作为上下文..." : "输入 Prompt..."}
          />
          <button 
            onClick={handleGenerate}
            disabled={!prompt.trim()}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed hover:opacity-90 font-medium tracking-wider shadow-lg"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            引擎生成
          </button>
        </div>
      )}

      {isGenerating && (
        <div className="h-32 bg-black/40 rounded-xl border border-white/10 flex flex-col items-center justify-center text-white/60 gap-3 relative z-10 shadow-inner">
          <div className="relative w-8 h-8 flex items-center justify-center">
             <div className="absolute inset-0 border-2 border-pink-500/20 rounded-full"></div>
             <div className="absolute inset-0 border-2 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <span className="text-[10px] font-light tracking-widest text-pink-300">GPU 算力分配中...</span>
        </div>
      )}

      {resultUrl && (
        <div className="mt-3 w-full rounded-xl overflow-hidden border border-white/20 bg-black/60 relative z-10 shadow-inner">
          {data.type === 'video' ? (
            <video src={resultUrl} controls autoPlay loop muted className="w-full h-auto object-cover max-h-[180px] opacity-95" />
          ) : data.type === 'image' ? (
            <img src={resultUrl} alt="Generated" className="w-full h-auto object-cover max-h-[180px] opacity-95" />
          ) : (
            <div className="text-xs text-white/80 p-4 whitespace-pre-wrap max-h-[180px] overflow-y-auto scrollbar-thin leading-relaxed font-light">
              {resultUrl}
            </div>
          )}
        </div>
      )}

      {/* 强化版连接点：源节点 */}
      <Handle 
        id="source"
        type="source" 
        position={Position.Right} 
        className="!w-4 !h-4 !bg-pink-500 !border-2 !border-black !-mr-2 z-50 transition-transform hover:scale-125 cursor-crosshair shadow-lg" 
      />
    </div>
  );
};
