"use client";

import { useState } from "react";
import { X, Copy, MonitorPlay, Plus, Sparkles, ChevronDown, Image as ImageIcon, Video, FileText, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

const INDUSTRIES = ["全部", "教育培训", "3c及电器", "互联网", "美妆", "母婴", "宠物"];
const TEMPLATES = [
  { id: 1, title: "猫咪要看世界杯", img: "https://picsum.photos/seed/cat1/400/300", tag: "PixVerse" },
  { id: 2, title: "种草视频", img: "https://picsum.photos/seed/plant/400/300", tag: "" },
  { id: 3, title: "产品宣传片", img: "https://picsum.photos/seed/product/400/300", tag: "" },
  { id: 4, title: "高燃战斗", img: "https://picsum.photos/seed/fight/400/300", tag: "" },
];

export function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<"template" | "basic" | "free" | null>(null);
  
  // Template State
  const [tplType, setTplType] = useState("creative");
  const [tplInd, setTplInd] = useState("全部");
  const [selectedTpl, setSelectedTpl] = useState<number | null>(1);

  // Basic State
  const [basicType, setBasicType] = useState<"t2v" | "i2v" | "edit">("t2v");

  const handleCreate = () => {
    void (async () => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mode === "template" ? "模板创作" : mode === "basic" ? "基础创作" : "自由创作",
          industry: "互联网",
          mode,
          ...(mode === "basic" ? { basicType } : {}),
          ...(mode === "template" && selectedTpl ? { templateId: selectedTpl } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "创建项目失败");
        return;
      }
      router.push(`/project/${data.project.id}`);
      onClose();
    })();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
      <div className={`w-full max-w-[1200px] glass-black rounded-[2rem] border border-white/10 flex flex-col relative overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 transition-all ${mode ? 'h-[85vh]' : 'h-auto'}`}>
        
        {/* Close button */}
        <button onClick={onClose} className="absolute top-6 right-6 z-50 text-glass-muted hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>

        {/* Header / Main Modes */}
        <div className={`px-10 flex flex-col items-center border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent shrink-0 transition-all duration-500 ${mode ? 'pt-6 pb-5 border-b' : 'pt-16 pb-16'}`}>
          <div className={`flex items-center gap-2 text-white/80 transition-all duration-500 ${mode ? 'mb-5 opacity-70 scale-90' : 'mb-10 opacity-100 scale-100'}`}>
            <Sparkles className="w-4 h-4" />
            <span className="font-light tracking-widest text-sm">选择一种创作方式</span>
          </div>

          <div className={`flex justify-center w-full transition-all duration-500 ${mode ? 'gap-4 max-w-4xl' : 'gap-8 max-w-5xl'}`}>
            <ModeCard 
              active={mode === "template"} 
              onClick={() => setMode("template")}
              icon={<Copy className={mode ? "w-5 h-5" : "w-6 h-6"} />}
              title="模板创作"
              desc="套用成熟工作流"
              gradient="from-pink-500/20 to-purple-500/20"
              compact={!!mode}
            />
            <ModeCard 
              active={mode === "basic"} 
              onClick={() => setMode("basic")}
              icon={<MonitorPlay className={mode ? "w-5 h-5" : "w-6 h-6"} />}
              title="基础创作"
              desc="从文字、图片或视频开始"
              gradient="from-blue-500/20 to-cyan-500/20"
              compact={!!mode}
            />
            <ModeCard 
              active={mode === "free"} 
              onClick={() => setMode("free")}
              icon={<Plus className={mode ? "w-5 h-5" : "w-6 h-6"} />}
              title="自由创作"
              desc="进入空白画布"
              gradient="from-emerald-500/20 to-teal-500/20"
              compact={!!mode}
            />
          </div>
        </div>

        {/* Dynamic Content Area (Only visible when mode is selected) */}
        {mode && (
          <div className="flex-1 overflow-hidden flex flex-col bg-black/20 relative">
            {mode === "template" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                 {/* Filters */}
                 <div className="px-6 pt-2 pb-4 shrink-0 flex flex-col gap-4">
                   <div className="flex gap-2 justify-center">
                     {INDUSTRIES.map(ind => (
                       <button key={ind} onClick={()=>setTplInd(ind)} className={`px-4 py-1.5 rounded-full text-[10px] transition-colors ${tplInd === ind ? 'bg-pink-500/20 border border-pink-500/30 text-pink-100' : 'bg-white/5 border border-white/5 text-glass-muted hover:text-white'}`}>
                         {ind}
                       </button>
                     ))}
                   </div>
                 </div>
                 
                 {/* Gallery */}
                 <div className="flex-1 overflow-y-auto px-6 pb-24">
                   <div className="grid grid-cols-4 gap-3">
                     {TEMPLATES.map(tpl => (
                       <div key={tpl.id} onClick={()=>setSelectedTpl(tpl.id)} className={`aspect-video rounded-xl overflow-hidden relative cursor-pointer group border-2 transition-all ${selectedTpl === tpl.id ? 'border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'border-white/5 hover:border-white/20'}`}>
                         <img src={tpl.img} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
                           {tpl.tag && <span className="absolute top-2 right-2 text-[8px] glass-black px-1.5 py-0.5 rounded text-white/80">{tpl.tag}</span>}
                           <h3 className="text-xs font-medium text-white tracking-wide">{tpl.title}</h3>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Bottom Action Bar */}
                 {selectedTpl && (
                   <div className="absolute bottom-0 left-0 right-0 glass-black border-t border-white/10 p-5 flex items-center justify-between shadow-[0_-5px_30px_rgba(0,0,0,0.8)] z-50">
                     <div className="flex flex-col gap-3 flex-1">
                       <div className="flex items-center">
                          <input 
                            type="text" 
                            className="bg-transparent border-none outline-none text-sm text-white/90 font-light w-full placeholder:text-white/30" 
                            placeholder="在这里输入视频生成提示词..." 
                          />
                       </div>
                       <div className="flex items-center gap-3">
                         <SelectBox label="16:9" options={["16:9", "9:16", "1:1", "4:3"]} />
                         <SelectBox label="720p" options={["480p", "720p", "1080p"]} />
                         <SelectBox label="1s-10s" options={["1s-3s", "1s-5s", "1s-10s"]} />
                       </div>
                     </div>

                     <div className="flex items-center gap-5 ml-6">
                       <SelectBox label="1个" options={["1个", "2个", "4个"]} />
                       <button onClick={handleCreate} className="px-6 py-2.5 glass-pink text-white font-medium rounded-xl text-sm tracking-widest flex items-center gap-2 hover:bg-pink-500/30 transition-colors shadow-lg">
                         <Sparkles className="w-4 h-4" /> 创作
                       </button>
                     </div>
                   </div>
                 )}
              </div>
            )}

            {mode === "basic" && (
              <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                 {/* Sub tabs */}
                 <div className="flex justify-center mb-6 shrink-0">
                   <div className="flex glass-black rounded-full p-1 border border-white/5">
                     <button onClick={()=>setBasicType('t2v')} className={`px-6 py-1.5 rounded-full text-[10px] transition-colors ${basicType === 't2v' ? 'glass-silver text-white' : 'text-glass-muted hover:text-white'}`}>文生视频</button>
                     <button onClick={()=>setBasicType('i2v')} className={`px-6 py-1.5 rounded-full text-[10px] transition-colors ${basicType === 'i2v' ? 'glass-silver text-white' : 'text-glass-muted hover:text-white'}`}>图片生成视频</button>
                     <button onClick={()=>setBasicType('edit')} className={`px-6 py-1.5 rounded-full text-[10px] transition-colors ${basicType === 'edit' ? 'glass-silver text-white' : 'text-glass-muted hover:text-white'}`}>视频编辑</button>
                   </div>
                 </div>

                 {/* Large Content Area */}
                 <div className="shrink-0 glass-black border border-white/10 rounded-2xl p-6 flex gap-6 min-h-[300px]">
                    {/* Left Info */}
                    <div className="w-1/3 flex flex-col justify-center items-start">
                      <div className="glass-silver px-2 py-1 rounded-md border border-white/10 flex items-center gap-1.5 mb-4">
                         {basicType === 't2v' && <FileText className="w-3 h-3 text-pink-300" />}
                         {basicType === 'i2v' && <ImageIcon className="w-3 h-3 text-pink-300" />}
                         {basicType === 'edit' && <Video className="w-3 h-3 text-pink-300" />}
                         <span className="text-[10px] text-white/80 tracking-widest">
                           {basicType === 't2v' ? '文案驱动' : basicType === 'i2v' ? '图像驱动' : '片段调整'}
                         </span>
                      </div>
                      <h2 className="text-xl font-medium text-white tracking-wider mb-2">
                        {basicType === 't2v' ? '文生视频' : basicType === 'i2v' ? '图片生成视频' : '视频编辑'}
                      </h2>
                      <p className="text-[11px] text-glass-muted font-light leading-relaxed mb-6">
                        {basicType === 't2v' 
                          ? '先写脚本或口播文本，再连接到视频生成节点，适合从完整文案快速生成画面。'
                          : basicType === 'i2v'
                          ? '上传参考图或风格图，AI将以图像为起点，为你延展出流畅生动的视频片段。'
                          : '导入已有视频片段，进行智能剪辑、滤镜调整或通过AI重绘局部画面。'
                        }
                      </p>
                      <button onClick={handleCreate} className="px-5 py-2 glass-silver hover:bg-white/10 border border-white/20 text-white font-medium rounded-lg text-xs tracking-widest flex items-center gap-1.5 transition-colors shadow-md">
                         <Sparkles className="w-3 h-3" /> 创作视频
                      </button>
                    </div>

                    {/* Right Mock Graphic */}
                    <div className="w-2/3 glass-black rounded-xl border border-white/5 relative overflow-hidden bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] flex items-center justify-center p-4">
                        
                        <div className="flex items-center gap-4 relative z-10 w-full px-4">
                          {/* Node 1 */}
                          <div className="w-32 h-24 glass-black border border-white/10 rounded-lg p-3 flex flex-col justify-between shadow-lg">
                             <div className="flex items-center justify-between">
                               <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center">
                                 {basicType === 't2v' ? <FileText className="w-2.5 h-2.5 text-white/50" /> : <ImageIcon className="w-2.5 h-2.5 text-white/50" />}
                               </div>
                               <span className="text-[8px] text-white/30">Node</span>
                             </div>
                             <div className="space-y-1.5 mt-2">
                               <div className="h-1 w-full bg-white/10 rounded" />
                               <div className="h-1 w-4/5 bg-white/10 rounded" />
                               <div className="h-1 w-3/5 bg-white/10 rounded" />
                             </div>
                          </div>

                          {/* Connection */}
                          <div className="flex-1 h-px bg-gradient-to-r from-pink-500/50 via-white/20 to-pink-500/50 relative">
                             <div className="absolute w-1.5 h-1.5 rounded-full bg-pink-400 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
                          </div>

                          {/* Node 2 (Grid or Video) */}
                          <div className="w-40 h-28 glass-silver border border-white/20 rounded-lg p-2 grid grid-cols-3 grid-rows-2 gap-1.5 shadow-lg">
                             {[...Array(6)].map((_, i) => (
                               <div key={i} className="bg-white/5 rounded flex items-center justify-center overflow-hidden">
                                  <ImageIcon className="w-3 h-3 text-white/10" />
                               </div>
                             ))}
                          </div>
                        </div>

                    </div>
                 </div>
              </div>
            )}

            {mode === "free" && (
              <div className="flex-1 flex flex-col items-center justify-center p-6">
                 <div className="w-16 h-16 rounded-2xl glass-silver flex items-center justify-center mb-4 shadow-xl border border-white/10">
                   <Plus className="w-6 h-6 text-white/50" />
                 </div>
                 <h2 className="text-lg font-medium text-white tracking-widest mb-2">自由创作</h2>
                 <p className="text-xs text-glass-muted font-light mb-6">进入空白画布，从零开始搭建你的创意工作流</p>
                 <button onClick={handleCreate} className="px-6 py-2 glass-pink text-white font-medium rounded-lg text-xs tracking-widest flex items-center gap-1.5 hover:bg-pink-500/30 transition-colors shadow-md">
                   进入空白画布
                 </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ModeCard({ active, onClick, icon, title, desc, gradient, compact }: { active: boolean, onClick: () => void, icon: React.ReactNode, title: string, desc: string, gradient?: string, compact?: boolean }) {
  return (
    <div 
      onClick={onClick}
      className={`flex-1 flex items-center rounded-xl border cursor-pointer transition-all duration-300 relative overflow-hidden ${
        active 
          ? 'border-pink-500/40 shadow-[0_0_20px_rgba(236,72,153,0.15)] transform -translate-y-0.5' 
          : 'glass-black border-white/5 hover:border-white/20 hover:bg-white/5'
      } ${compact ? 'p-3' : 'p-6'}`}
    >
      {active && gradient && (
        <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-30`} />
      )}
      <div className={`rounded-xl flex items-center justify-center relative z-10 transition-all duration-300 ${
        active ? 'bg-white/10 text-white' : 'bg-white/5 text-white/50'
      } ${compact ? 'w-10 h-10 mr-3' : 'w-14 h-14 mr-5'}`}>
        {icon}
      </div>
      <div className="relative z-10">
        <h3 className={`font-medium tracking-wider mb-1 transition-all duration-300 ${
          active ? 'text-white' : 'text-white/80'
        } ${compact ? 'text-xs' : 'text-base'}`}>{title}</h3>
        <p className={`text-glass-muted font-light transition-all duration-300 ${
          compact ? 'text-[9px]' : 'text-xs'
        }`}>{desc}</p>
      </div>
    </div>
  );
}

function SelectBox({ label, options }: { label: string, options?: string[] }) {
  return (
    <div className="group relative">
      <div className="px-3 py-1.5 glass-black border border-white/10 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-white/5 transition-colors">
        <span className="text-[10px] text-white/80 font-light">{label}</span>
        <ChevronDown className="w-3 h-3 text-white/40" />
      </div>
      {options && (
        <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block glass-black border border-white/10 rounded-lg overflow-hidden z-[999] min-w-full shadow-xl">
          {options.map(opt => (
            <div key={opt} className="px-3 py-2 text-[10px] text-white/80 hover:bg-white/10 hover:text-white cursor-pointer whitespace-nowrap border-b border-white/5 last:border-0">
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
