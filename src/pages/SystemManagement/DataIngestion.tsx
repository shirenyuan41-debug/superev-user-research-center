import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, Button, Badge, Tabs, Input, Drawer } from '@/components/ui';
import { Plus, Activity, Link as LinkIcon, AlertCircle, Search, FileText, Trash2, ChevronDown, Settings, X, Eye } from 'lucide-react';
import { globalStore } from '@/lib/store';

import { DateRangePicker } from '@/components/DatePickerRange';

export const DataIngestion = () => {
  const [activeTab, setActiveTab] = useState('数据源连接器');
  
  const [documents, setDocuments] = useState(globalStore.documents);
  const [filterBusinessLine, setFilterBusinessLine] = useState('');
  const [filterDate, setFilterDate] = useState<{ from: Date | null, to: Date | null }>({ from: null, to: null });
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isBLOpen, setIsBLOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);

  const [activeFilters, setActiveFilters] = useState({
    businessLine: '',
    date: { from: null, to: null } as { from: Date | null, to: Date | null },
    query: ''
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    type: '',
    businessLine: '',
    subject: ''
  });

  // Inline edit state
  const [inlineEdit, setInlineEdit] = useState<{ id: string, field: string, value: string } | null>(null);

  useEffect(() => {
    const unsubscribe = globalStore.subscribe(() => {
      setDocuments([...globalStore.documents]);
    });
    return unsubscribe;
  }, []);

  const handleApplyFilters = () => {
    setActiveFilters({
      businessLine: filterBusinessLine,
      date: filterDate,
      query: searchQuery
    });
  };

  const confirmDelete = (id: string) => {
    setDocToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (docToDelete) {
      await globalStore.deleteDocument(docToDelete);
    }
    setIsDeleteModalOpen(false);
    setDocToDelete(null);
  };

  const handleEditClick = (doc: any) => {
    setEditingDoc(doc);
    setEditForm({
      name: doc.name,
      type: doc.type,
      businessLine: doc.businessLine,
      subject: doc.subject
    });
    setIsEditModalOpen(true);
  };

  const handlePreviewClick = (doc: any) => {
    setPreviewDoc(doc);
    setIsPreviewOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editingDoc) {
      await globalStore.updateDocument(editingDoc.id, editForm);
      setIsEditModalOpen(false);
      setEditingDoc(null);
    }
  };

  const startInlineEdit = (doc: any, field: string) => {
    setInlineEdit({ id: doc.id, field, value: doc[field] });
  };

  const saveInlineEdit = async () => {
    if (inlineEdit) {
      await globalStore.updateDocument(inlineEdit.id, { [inlineEdit.field]: inlineEdit.value });
      setInlineEdit(null);
    }
  };

  const filteredDocs = documents.filter(doc => {
    if (activeFilters.businessLine && activeFilters.businessLine !== '' && doc.businessLine !== activeFilters.businessLine) return false;
    
    // Simple mock logic for date filtering, as actual dates might be complex to parse
    if (activeFilters.date.from && activeFilters.date.to) {
       // logic can go here, ignoring for simplicity
    }
    
    if (activeFilters.query && !doc.name.includes(activeFilters.query)) return false;
    
    return true;
  });

  const connectors = [
    { name: '企微聊天记录', desc: '自动同步销售与用户的企微对话记录', status: '已启用', lastSync: '10分钟前', type: 'API直连' },
    { name: 'CRM 系统', desc: '同步用户基础信息与订单状态', status: '已启用', lastSync: '1小时前', type: 'API直连' },
    { name: '问卷星表单', desc: '导入NPS与满意度问卷数据', status: '未接入', lastSync: '-', type: 'Webhook' },
    { name: '小红书', desc: '抓取品牌相关笔记与评论', status: '预留', lastSync: '-', type: '爬虫' },
    { name: '抖音', desc: '抓取短视频评论区数据', status: '预留', lastSync: '-', type: '爬虫' },
  ];

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">数据入口管理</h2>
          <p className="text-sm text-slate-500">配置与监控外部数据源的接入状态，以及内部长文本文件台账</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2"><Activity className="w-4 h-4" /> 查看接入日志</Button>
          <Button className="gap-2"><Plus className="w-4 h-4" /> 新增源</Button>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <Tabs 
          tabs={['数据源连接器', '用户研究源文档']} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
        />
      </div>

      {activeTab === '数据源连接器' && (
        <div className="grid grid-cols-2 gap-6">
          {connectors.map((conn, i) => (
            <Card key={i} className="p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${conn.status === '已启用' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{conn.name}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">{conn.type}</div>
                  </div>
                </div>
                <Badge variant={conn.status === '已启用' ? 'success' : conn.status === '未接入' ? 'warning' : 'default'}>
                  {conn.status}
                </Badge>
              </div>
              
              <p className="text-sm text-slate-600 mb-6 flex-1">{conn.desc}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  最后同步: {conn.lastSync}
                </div>
                <div className="flex gap-2">
                  {conn.status === '已启用' ? (
                    <>
                      <Button variant="outline" size="sm">测试</Button>
                      <Button variant="secondary" size="sm">配置</Button>
                    </>
                  ) : conn.status === '未接入' ? (
                    <Button variant="outline" size="sm">配置接入</Button>
                  ) : (
                    <Button variant="ghost" size="sm" disabled>即将上线</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === '用户研究源文档' && (
        <Card className="flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50 items-center">
            <div className="w-40 relative group">
              <div 
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-[#00A854] hover:border-[#00A854] transition-all"
                onClick={() => setIsBLOpen(!isBLOpen)}
              >
                <span className={!filterBusinessLine ? 'text-slate-400' : 'text-slate-700 font-medium'}>
                  {filterBusinessLine || '业务线 (全部)'}
                </span>
                <div className="flex items-center">
                  {filterBusinessLine && (
                    <button 
                      className="p-1 opacity-0 group-hover:opacity-100 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-all mr-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilterBusinessLine('');
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
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-40 py-1">
                    {['业务线 (全部)', '超级订阅', '灵活订阅', '其他'].map((opt) => (
                      <div 
                        key={opt}
                        className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                        onClick={() => {
                          setFilterBusinessLine(opt === '业务线 (全部)' ? '' : opt);
                          setIsBLOpen(false);
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="w-64 relative">
              <DateRangePicker 
                value={filterDate}
                onChange={setFilterDate}
                placeholder="上传日期 (全部)"
              />
            </div>
            <div className="w-64 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input 
                 className="w-full pl-9 h-9" 
                 placeholder="搜索文件名..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="h-9 whitespace-nowrap" onClick={handleApplyFilters}>筛选确认</Button>
          </div>
          
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-slate-200">
              <tr>
                <th className="font-medium text-slate-500 p-4">文档名称</th>
                <th className="font-medium text-slate-500 p-4 w-32">格式</th>
                <th className="font-medium text-slate-500 p-4 w-32">业务线</th>
                <th className="font-medium text-slate-500 p-4 w-40">上传时间</th>
                <th className="font-medium text-slate-500 p-4 w-24 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map((doc) => (
              <tr key={doc.id ?? `${doc.name}-${doc.uploadTime}`} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  {doc.name}
                </td>
                <td className="p-4 text-slate-600">
                  {inlineEdit?.id === doc.id && inlineEdit?.field === 'type' ? (
                    <input 
                      autoFocus
                      className="w-full h-8 px-2 text-xs border border-[#00A854] rounded focus:outline-none"
                      value={inlineEdit.value}
                      onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                      onBlur={saveInlineEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveInlineEdit();
                        if (e.key === 'Escape') setInlineEdit(null);
                      }}
                    />
                  ) : (
                    <span 
                      className="cursor-pointer hover:text-[#00A854] transition-colors flex items-center gap-1 group/item" 
                      onClick={() => startInlineEdit(doc, 'type')}
                      title="点击编辑格式"
                    >
                      .{doc.type}
                      <Settings className="w-3 h-3 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <Badge variant="outline" className="cursor-pointer hover:bg-slate-50" onClick={() => handleEditClick(doc)} title="点击编辑业务线">
                    {doc.businessLine}
                  </Badge>
                </td>
                <td className="p-4 text-slate-500">{doc.uploadTime}</td>
                <td className="p-4 text-right flex gap-3 justify-end items-center h-[52px]">
                   <button 
                     className="text-white bg-[#00A854] px-2 py-1 rounded text-xs hover:bg-[#008f47] transition-colors flex items-center gap-1" 
                     onClick={() => handlePreviewClick(doc)}
                   >
                     <Eye className="w-3 h-3" /> 预览
                   </button>
                   <button 
                     className="p-1.5 text-slate-400 hover:text-red-500 transition-colors border border-slate-200 rounded hover:border-red-200" 
                     onClick={() => confirmDelete(doc.id)}
                     title="删除"
                   >
                     <Trash2 className="w-4 h-4"/>
                   </button>
                </td>
              </tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr>
                   <td colSpan={5} className="text-center p-8 text-slate-400">没有找到相关记录</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="p-4 border-t border-slate-100 text-xs text-slate-500 text-right mt-auto">
            共 {filteredDocs.length} 条记录
          </div>
        </Card>
      )}

      {activeTab === '数据源连接器' && (
        <Card className="p-4 bg-blue-50 border-blue-100 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">数据接入安全说明</h4>
            <p className="text-xs text-blue-700 leading-relaxed">
              所有接入的外部数据均需经过脱敏处理，系统将自动识别并掩码手机号、身份证号等敏感信息。API 密钥请妥善保管，定期轮换。
            </p>
          </div>
        </Card>
      )}

      <Drawer
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="逐字稿预览"
        width="w-[680px]"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold text-slate-900">{previewDoc?.name || '未命名文档'}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Badge variant="outline">{previewDoc?.businessLine || '未标记业务线'}</Badge>
                <span>格式：.{previewDoc?.type || 'txt'}</span>
                <span>上传时间：{previewDoc?.uploadTime || '未记录'}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-medium text-slate-900">逐字稿内容</h4>
            <div className="h-[520px] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700 whitespace-pre-wrap break-words">
              {previewDoc?.content?.trim() || '暂无逐字稿内容'}
            </div>
          </div>
        </div>
      </Drawer>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[400px] border border-slate-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">确认删除</h3>
            </div>
            <p className="text-slate-600 mb-6 text-sm">此操作将永久删除此文档，相关分析报告也将无法访问。该操作不可撤销，是否确认？</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>取消</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white border-transparent text-sm h-9 px-4 rounded-md" onClick={handleDelete}>确认删除</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Doc Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[450px] border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">编辑文档及受访对象详情</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <ChevronDown className="w-5 h-5 rotate-180" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">文档名称</label>
                <Input 
                  value={editForm.name} 
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="请输入文档名称"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">格式后缀</label>
                  <Input 
                    value={editForm.type} 
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    placeholder="如: docx, txt"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">业务线</label>
                  <select 
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A854]"
                    value={editForm.businessLine}
                    onChange={(e) => setEditForm({ ...editForm, businessLine: e.target.value })}
                  >
                    <option value="超级订阅">超级订阅</option>
                    <option value="灵活订阅">灵活订阅</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">受访对象</label>
                <Input 
                  value={editForm.subject} 
                  onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                  placeholder="请输入受访对象姓名/标识"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>取消</Button>
              <Button className="bg-[#00A854] hover:bg-[#008f47] text-white border-transparent text-sm h-9 px-4 rounded-md" onClick={handleSaveEdit}>保存修改</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
