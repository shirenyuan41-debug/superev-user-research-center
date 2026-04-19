import React, { useEffect, useState } from 'react';
import { Card, Button, Badge, Drawer } from '@/components/ui';
import { ThumbsUp, ThumbsDown, MessageSquare, ArrowRight, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { globalStore } from '@/lib/store';
import {
  extractFeedbackKeywords,
  getFeedbackVoice,
  parseFeedbackTimestamp,
} from '@/lib/feedback';
import { DateRangePicker } from '@/components/DatePickerRange';

const formatFeedbackTime = (feedback: any) => {
  const timestamp = parseFeedbackTimestamp(feedback);
  return Number.isFinite(timestamp) ? new Date(timestamp).toLocaleString('zh-CN') : '';
};

const matchesSelectedTimeRange = (
  feedback: any,
  range: { from: Date | null; to: Date | null },
) => {
  if (!range.from && !range.to) {
    return true;
  }

  const feedbackTimestamp = parseFeedbackTimestamp(feedback);
  if (!Number.isFinite(feedbackTimestamp)) {
    return false;
  }

  const fromTimestamp = range.from
    ? new Date(range.from).setHours(0, 0, 0, 0)
    : Number.NEGATIVE_INFINITY;
  const toTimestamp = range.to
    ? new Date(range.to).setHours(23, 59, 59, 999)
    : Number.POSITIVE_INFINITY;

  return feedbackTimestamp >= fromTimestamp && feedbackTimestamp <= toTimestamp;
};

export const UsageFeedback = () => {
  const [filterTime, setFilterTime] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [filterModule, setFilterModule] = useState('全部');
  const [filterBusinessLine, setFilterBusinessLine] = useState('超级订阅');
  const [isModuleOpen, setIsModuleOpen] = useState(false);
  const [isBLOpen, setIsBLOpen] = useState(false);
  const [isRecordsDrawerOpen, setIsRecordsDrawerOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState(globalStore.feedbacks);
  const [activeFilters, setActiveFilters] = useState({
    time: { from: null, to: null } as { from: Date | null; to: Date | null },
    module: '全部',
    businessLine: '超级订阅',
  });

  useEffect(() => {
    const unsub = globalStore.subscribe(() => {
      setFeedbacks([...globalStore.feedbacks]);
    });
    return unsub;
  }, []);

  const handleApplyFilters = () => {
    setActiveFilters({
      time: filterTime,
      module: filterModule,
      businessLine: filterBusinessLine,
    });
  };

  const sourceFeedbacks = feedbacks.filter((feedback: any) => feedback.module === '访谈分析');
  const filteredFeedbacks = sourceFeedbacks
    .filter((feedback: any) => {
      if (activeFilters.module !== '全部' && feedback.module !== activeFilters.module) {
        return false;
      }

      if (activeFilters.businessLine !== '全部' && feedback.businessLine !== activeFilters.businessLine) {
        return false;
      }

      return matchesSelectedTimeRange(feedback, activeFilters.time);
    })
    .sort((left: any, right: any) => parseFeedbackTimestamp(right) - parseFeedbackTimestamp(left));

  const totalReviews = filteredFeedbacks.length;
  const upReviews = filteredFeedbacks.filter((feedback: any) => feedback.type === 'up').length;
  const downFeedbacks = filteredFeedbacks.filter((feedback: any) => feedback.type === 'down');
  const downReviews = downFeedbacks.length;
  const upRate = totalReviews > 0 ? `${((upReviews / totalReviews) * 100).toFixed(1)}%` : '0.0%';
  const clusteredReasons = extractFeedbackKeywords(downFeedbacks, 6)
    .filter((item) => item.count >= 2);
  const maxClusterCount = clusteredReasons[0]?.count || 1;

  return (
    <>
      <div className="space-y-6">
        <Card className="p-4 flex gap-4 items-end">
          <div className="w-64">
            <label className="block text-xs font-medium text-slate-500 mb-1">时间范围</label>
            <DateRangePicker
              value={filterTime}
              onChange={setFilterTime}
            />
          </div>

          <div className="w-48 relative group">
            <label className="block text-xs font-medium text-slate-500 mb-1">模块</label>
            <div
              className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-[#00A854] hover:border-[#00A854] transition-all"
              onClick={() => setIsModuleOpen(!isModuleOpen)}
            >
              <span className={filterModule === '全部' ? 'text-slate-400' : 'text-slate-700 font-medium'}>
                {filterModule}
              </span>
              <div className="flex items-center">
                {filterModule !== '全部' && (
                  <button
                    className="p-1 opacity-0 group-hover:opacity-100 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-all mr-1"
                    onClick={(event) => {
                      event.stopPropagation();
                      setFilterModule('全部');
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', isModuleOpen ? 'rotate-180' : '')} />
              </div>
            </div>

            {isModuleOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsModuleOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1">
                  {['全部', '访谈分析'].map((option) => (
                    <div
                      key={option}
                      className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer text-slate-700"
                      onClick={() => {
                        setFilterModule(option);
                        setIsModuleOpen(false);
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="w-48 relative group">
            <label className="block text-xs font-medium text-slate-500 mb-1">业务线</label>
            <div
              className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-[#00A854] hover:border-[#00A854] transition-all"
              onClick={() => setIsBLOpen(!isBLOpen)}
            >
              <span className={filterBusinessLine === '全部' ? 'text-slate-400' : 'text-slate-700 font-medium'}>
                {filterBusinessLine}
              </span>
              <div className="flex items-center">
                {filterBusinessLine !== '全部' && (
                  <button
                    className="p-1 opacity-0 group-hover:opacity-100 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-all mr-1"
                    onClick={(event) => {
                      event.stopPropagation();
                      setFilterBusinessLine('全部');
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', isBLOpen ? 'rotate-180' : '')} />
              </div>
            </div>

            {isBLOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsBLOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1">
                  {['全部', '超级订阅', '灵活订阅', '其他'].map((option) => (
                    <div
                      key={option}
                      className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer text-slate-700"
                      onClick={() => {
                        setFilterBusinessLine(option);
                        setIsBLOpen(false);
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <Button className="h-9 whitespace-nowrap" onClick={handleApplyFilters}>确认</Button>
        </Card>

        <div className="grid grid-cols-3 gap-6">
          <Card className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-slate-500 mb-1">总评价数</div>
              <div className="text-2xl font-bold text-slate-900">{totalReviews}</div>
            </div>
          </Card>

          <Card className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <ThumbsUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-slate-500 mb-1">AI 结果点赞率</div>
              <div className="text-2xl font-bold text-slate-900">{upRate}</div>
            </div>
          </Card>

          <Card className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <ThumbsDown className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-slate-500 mb-1">低分样本数 (需优化)</div>
              <div className="text-2xl font-bold text-slate-900">{downReviews}</div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-1 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-6">点踩原因聚类</h3>
            {clusteredReasons.length > 0 ? (
              <div className="space-y-4">
                {clusteredReasons.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700">{item.label}</span>
                      <span className="text-slate-500">{item.count} 次</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400"
                        style={{ width: `${Math.max((item.count / maxClusterCount) * 100, 12)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full min-h-[220px] flex items-center justify-center text-sm text-slate-400 text-center">
                当前筛选条件下暂无可聚类的点踩留言数据
              </div>
            )}
          </Card>

          <Card className="col-span-2 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-semibold text-slate-900">低质量样本VOC</h3>
              <Button variant="outline" size="sm" disabled={downFeedbacks.length === 0}>同步到提示词管理</Button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {downFeedbacks.map((sample: any) => {
                const voice = getFeedbackVoice(sample);

                return (
                  <div key={sample.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-4 mb-3 flex-wrap text-xs">
                      <span className="text-xs text-slate-400">{formatFeedbackTime(sample)}</span>
                      <span className="text-xs text-slate-500">{sample.businessLine || '未标记业务线'}</span>
                    </div>

                    <div className="text-sm text-slate-700 italic leading-7">
                      {voice ? `"${voice}"` : '当前记录未填写留言原文'}
                    </div>
                  </div>
                );
              })}

              {downFeedbacks.length === 0 && (
                <div className="py-10 text-center text-sm text-slate-400">
                  当前筛选条件下暂无低分样本
                </div>
              )}
            </div>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                className="text-slate-500 hover:text-slate-700"
                disabled={filteredFeedbacks.length === 0}
                onClick={() => setIsRecordsDrawerOpen(true)}
              >
                查看全部评价记录 <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Drawer
        isOpen={isRecordsDrawerOpen}
        onClose={() => setIsRecordsDrawerOpen(false)}
        title="全部评价记录"
        width="w-[760px]"
      >
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">用户评价</th>
                <th className="px-4 py-3 font-medium">用户原声</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFeedbacks.map((feedback: any) => {
                const voice = getFeedbackVoice(feedback);

                return (
                  <tr key={feedback.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant={feedback.type === 'down' ? 'danger' : 'success'}>
                          {feedback.type === 'down' ? '踩' : '赞'}
                        </Badge>
                        <span className="text-xs text-slate-400">{formatFeedbackTime(feedback)}</span>
                        <span className="text-xs text-slate-400">{feedback.businessLine || '未标记业务线'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-700 leading-6">
                        {voice || '当前记录未填写留言原声'}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredFeedbacks.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-10 text-center text-sm text-slate-400">
                    当前筛选条件下暂无真实评价记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Drawer>
    </>
  );
};
