import React, { useState } from 'react';
import { Card, Button, Tabs, Input, Badge, Drawer } from '@/components/ui';
import { Search, Filter, FileText, Download, ChevronRight, Users, Eye } from 'lucide-react';

export const DataCenter = () => {
  const [activeTab, setActiveTab] = useState('结构化数据');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-6">
        <Tabs 
          tabs={['结构化数据', '原始资料库', '全局检索']} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
        />
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input className="pl-9 h-9" placeholder="在数据中心全局搜索..." />
        </div>
      </div>

      {(activeTab === '结构化数据' || activeTab === '全局检索') && (
        <div className="flex flex-1 gap-6 min-h-0">
          {/* Left: Filters */}
          <Card className="w-64 p-4 shrink-0 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-900">
              <Filter className="w-4 h-4" /> 筛选条件
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="text-xs font-medium text-slate-500 mb-2">数据来源</div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[#00A854]" /> 用户研究
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[#00A854]" /> 销转研究
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" className="rounded border-slate-300 text-[#00A854]" /> 舆情研究
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" className="rounded border-slate-300 text-[#00A854]" /> 员工研究
                  </label>
                </div>
              </div>
              
              <div>
                <div className="text-xs font-medium text-slate-500 mb-2">资产类型</div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[#00A854]" /> 结构化结果
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[#00A854]" /> 原始文档
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[#00A854]" /> 画像卡片
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" className="rounded border-slate-300 text-[#00A854]" /> 分析报告
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Middle: List */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="text-sm font-medium text-slate-700">找到 1,245 条结果</span>
              <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> 批量导出</Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {[
                { title: '科技尝鲜型中产画像', type: '画像卡片', source: '用户研究', date: '2026-04-15' },
                { title: '乐道 L60 试驾反馈洞察', type: '结构化结果', source: '销转研究', date: '2026-04-14' },
                { title: '张先生_深度访谈.docx', type: '原始文档', source: '用户研究', date: '2026-04-12' },
                { title: 'Q1 灵活订阅用户流失分析', type: '分析报告', source: '用户研究', date: '2026-04-10' },
              ].map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer border border-transparent hover:border-slate-200 transition-colors"
                  onClick={() => setIsPreviewOpen(true)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 text-sm mb-1">{item.title}</div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                        <span className="text-xs text-slate-400">{item.source}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400">{item.date}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === '原始资料库' && (
        <Card className="flex-1 overflow-hidden flex flex-col">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">资料标题</th>
                <th className="px-6 py-3 font-medium">来源</th>
                <th className="px-6 py-3 font-medium">上传时间</th>
                <th className="px-6 py-3 font-medium">标签</th>
                <th className="px-6 py-3 font-medium">状态</th>
                <th className="px-6 py-3 font-medium">关联资产</th>
                <th className="px-6 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { title: '访谈逐字稿_李女士.txt', source: '访谈录音转写', time: '2026-04-15 14:30', tags: ['灵活订阅', '退订'], status: '已结构化', assets: 3 },
                { title: '企微聊天记录_王总.csv', source: '企微导出', time: '2026-04-14 09:15', tags: ['企业用车', '高意向'], status: '已结构化', assets: 1 },
                { title: '小红书评论快照_0412.json', source: '爬虫接入', time: '2026-04-12 18:00', tags: ['竞品对比'], status: '未处理', assets: 0 },
              ].map((item, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" /> {item.title}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{item.source}</td>
                  <td className="px-6 py-4 text-slate-500">{item.time}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {item.tags.map(tag => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={item.status === '已结构化' ? 'success' : 'default'}>{item.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{item.assets} 项</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setIsPreviewOpen(true)}>预览</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Preview Drawer */}
      <Drawer isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title="资料预览" width="w-[600px]">
        <div className="space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center text-slate-500">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">张先生_深度访谈.docx</h2>
              <div className="text-sm text-slate-500 mt-1">上传于 2026-04-12 · 1.2 MB</div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-900 mb-3">关联结构化资产</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 flex items-center gap-3 cursor-pointer hover:border-[#00A854]">
                <Users className="w-4 h-4 text-[#00A854]" />
                <span className="text-sm text-slate-700">单体画像：张先生</span>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 flex items-center gap-3 cursor-pointer hover:border-[#00A854]">
                <FileText className="w-4 h-4 text-[#00A854]" />
                <span className="text-sm text-slate-700">访谈分析报告</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-900 mb-3">内容预览</h4>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700 leading-relaxed font-mono h-96 overflow-y-auto">
              访谈者：当时为什么考虑选择我们的超级订阅服务呢？<br/><br/>
              张先生：主要还是觉得电车更新太快，买不如租。但我其实对你们那个一年后换新车的权益没太搞懂，销售当时说得挺含糊的。<br/><br/>
              访谈者：您能具体说说哪里没搞懂吗？<br/><br/>
              张先生：就是比如我现在开的是L60，一年后我想换L90，这个差价怎么算？是按当时的指导价补差价，还是按我现在的租金比例？官网上的说明太绕了，我看了半天也没明白。
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-3">
            <Button className="flex-1 gap-2"><Download className="w-4 h-4" /> 下载原文件</Button>
            <Button variant="outline" className="flex-1">重新分析</Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
