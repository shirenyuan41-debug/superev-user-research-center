import React, { useState } from 'react';
import { Card, Button, Tabs, Badge, Input } from '@/components/ui';
import { Upload, FileText, MessageSquare, Database, CheckCircle2, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

import { DateRangePicker } from '@/components/DatePickerRange';

export const SalesResearch = () => {
  const [activeTab, setActiveTab] = useState('聊天记录分析');
  
  const [businessLine, setBusinessLine] = useState('超级订阅');
  const [source, setSource] = useState('企微聊天记录');
  const [timeRange, setTimeRange] = useState<{ from: Date | null, to: Date | null }>({ from: null, to: null });
  
  const [isBLOpen, setIsBLOpen] = useState(false);
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [isTROpen, setIsTROpen] = useState(false);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <Tabs tabs={['聊天记录分析', '文案工坊 Beta']} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === '聊天记录分析' && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Top Filter */}
          <Card className="p-4 mb-4 shrink-0 flex gap-4">
            <div className="w-48 relative group">
              <label className="block text-xs font-medium text-slate-500 mb-1">业务线</label>
              <div 
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-[#00A854] hover:border-[#00A854] transition-all"
                onClick={() => setIsBLOpen(!isBLOpen)}
              >
                <span className={!businessLine ? 'text-slate-400' : 'text-slate-700 font-medium'}>{businessLine || '全部'}</span>
                <div className="flex items-center">
                  {businessLine && (
                    <button 
                      className="p-1 opacity-0 group-hover:opacity-100 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-all mr-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBusinessLine('');
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isBLOpen ? "rotate-180" : "")} />
                </div>
              </div>
              {isBLOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsBLOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1">
                    {['超级订阅', '灵活订阅', '其他'].map((opt) => (
                      <div 
                        key={opt}
                        className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer text-slate-700"
                        onClick={() => { setBusinessLine(opt); setIsBLOpen(false); }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="w-48 relative group">
              <label className="block text-xs font-medium text-slate-500 mb-1">来源</label>
              <div 
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-[#00A854] hover:border-[#00A854] transition-all"
                onClick={() => setIsSourceOpen(!isSourceOpen)}
              >
                <span className={!source ? 'text-slate-400' : 'text-slate-700 font-medium'}>{source || '全部'}</span>
                <div className="flex items-center">
                  {source && (
                    <button 
                      className="p-1 opacity-0 group-hover:opacity-100 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-all mr-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSource('');
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isSourceOpen ? "rotate-180" : "")} />
                </div>
              </div>
              {isSourceOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsSourceOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1">
                    {['企微聊天记录', '官网客服'].map((opt) => (
                      <div 
                        key={opt}
                        className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer text-slate-700"
                        onClick={() => { setSource(opt); setIsSourceOpen(false); }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="w-64 relative">
              <label className="block text-xs font-medium text-slate-500 mb-1">时间范围</label>
              <DateRangePicker 
                value={timeRange}
                onChange={setTimeRange}
              />
            </div>
          </Card>

          {/* 3-Column Layout */}
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Left: Import */}
            <Card className="w-72 flex flex-col shrink-0">
              <div className="p-4 border-b border-slate-100 font-medium text-sm">导入区</div>
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-20 flex-col gap-2 text-xs">
                    <Upload className="w-5 h-5 text-slate-400" />
                    上传记录
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2 text-xs">
                    <FileText className="w-5 h-5 text-slate-400" />
                    粘贴对话
                  </Button>
                </div>
                
                <div className="pt-4 border-t border-slate-100">
                  <div className="text-xs font-medium text-slate-500 mb-2">会话列表 (3)</div>
                  <div className="space-y-2">
                    {['李女士_意向咨询', '王先生_对比买断', '陈总_企业用车'].map((name, i) => (
                      <div key={i} className={`p-2 rounded border text-xs flex items-center justify-between cursor-pointer ${i === 0 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
                        <span className="truncate">{name}</span>
                        {i === 0 && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Middle: Analysis */}
            <Card className="flex-1 flex flex-col min-w-0 p-6 overflow-y-auto bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">结构化分析结果</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">意向车型</div>
                  <div className="font-medium text-slate-900">乐道 L60</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">用车城市</div>
                  <div className="font-medium text-slate-900">上海</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">用车时长</div>
                  <div className="font-medium text-slate-900">12个月 (超级订阅)</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">未成交原因 (当前阻碍)</div>
                  <div className="font-medium text-red-600">觉得首付押金过高，对比了其他租车平台。</div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">用户需求分析</h4>
                  <p className="text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-lg border border-slate-200">
                    该用户主要用于日常通勤和周末周边游，对车辆的智能化配置（特别是自动泊车）要求较高。目前处于深度对比阶段，对价格敏感，但更看重服务体验。
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">高频原话</h4>
                  <div className="p-4 bg-slate-100 rounded-lg text-sm text-slate-700 italic border-l-4 border-[#00A854]">
                    “你们这个押金能免吗？我看隔壁家芝麻信用分高就可以免押金。车我是挺喜欢的，就是前期投入感觉有点大。”
                  </div>
                </div>
              </div>
            </Card>

            {/* Right: Conversion */}
            <Card className="w-64 flex flex-col shrink-0">
              <div className="p-4 border-b border-slate-100 font-medium text-sm">转化判断台</div>
              <div className="p-4 space-y-6">
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-3">意向分级 (本批次)</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-100">
                      <span className="text-sm font-medium text-red-700">高意向</span>
                      <span className="text-sm font-bold text-red-700">12 人</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-amber-50 rounded border border-amber-100">
                      <span className="text-sm font-medium text-amber-700">中意向</span>
                      <span className="text-sm font-bold text-amber-700">45 人</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-sm font-medium text-slate-700">低意向</span>
                      <span className="text-sm font-bold text-slate-700">89 人</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <Button className="w-full justify-start gap-2 text-sm">
                    <MessageSquare className="w-4 h-4" />
                    生成跟进 Todo
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                    <Database className="w-4 h-4 text-slate-400" />
                    加入数据中心
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === '文案工坊 Beta' && (
        <div className="flex gap-6 h-full">
          <Card className="w-80 p-6 shrink-0 overflow-y-auto">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">生成设置</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">活动目标</label>
                <Input placeholder="例如：促单、挽回、节日问候" defaultValue="促单" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">目标人群</label>
                <Input placeholder="例如：高意向未下订用户" defaultValue="高意向未下订用户" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">产品</label>
                <select className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
                  <option>超级订阅 - 乐道L60</option>
                  <option>灵活订阅 - 萤火虫</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">渠道</label>
                <select className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
                  <option>企微私聊</option>
                  <option>朋友圈</option>
                  <option>短信</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">风格</label>
                <select className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
                  <option>专业真诚</option>
                  <option>幽默风趣</option>
                  <option>紧迫感</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">引用研究结果 (可选)</label>
                <select className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
                  <option>无</option>
                  <option>近期“免押金”需求洞察</option>
                </select>
              </div>
              <Button className="w-full mt-4">生成文案</Button>
            </div>
          </Card>

          <div className="flex-1 space-y-4 overflow-y-auto">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-3">
                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">咨询引导版</Badge>
                <Button variant="ghost" size="sm">复制</Button>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                哈喽！最近看您在关注乐道 L60 的超级订阅。刚好我们这周针对优质客户申请到了“免押金”的绿色通道名额，不知道您这边是否感兴趣了解一下具体政策？可以帮您省下一大笔前期费用哦~
              </p>
            </Card>
            <Card className="p-6">
              <div className="flex justify-between items-center mb-3">
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">卖点强调版</Badge>
                <Button variant="ghost" size="sm">复制</Button>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                您好！乐道 L60 的最新 OTA 升级了自动泊车功能，体验非常棒。超级订阅最大的好处就是——您永远都在开最新技术的车。现在下订，最快下周就能提车，要不要给您安排一次深度试驾体验下新功能？
              </p>
            </Card>
            <Card className="p-6">
              <div className="flex justify-between items-center mb-3">
                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">场景共鸣版</Badge>
                <Button variant="ghost" size="sm">复制</Button>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                周末好！马上到年底了，是不是有带家人周边游的计划？乐道 L60 的大空间特别适合全家出行。如果现在选择超级订阅，不仅不用操心车辆保养，还能赶在节前开上新车。有空的话，我给您算算具体的账？
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
