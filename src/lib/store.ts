import { ApiError, api } from './api';
import { normalizeAnalysisResult } from '../../shared/analysis-utils';
import {
  BUSINESS_LINE_OPTIONS,
  createDefaultPromptVersions,
  PROMPT_MODULES,
  TODO_DEPARTMENTS,
  TODO_STATUSES,
  TODO_TYPES,
  type PromptModule,
  type PromptVersion,
  type PromptVersionStatus,
  type PromptVersionsByModule,
  type TodoItem,
  type TodoStatus,
} from '../../shared/domain';

export {
  BUSINESS_LINE_OPTIONS,
  PROMPT_MODULES,
  TODO_DEPARTMENTS,
  TODO_STATUSES,
  TODO_TYPES,
  type PromptModule,
  type PromptVersion,
  type PromptVersionStatus,
  type TodoItem,
  type TodoStatus,
};

export type Listener = () => void;

const isIgnorableAuthorizationError = (error: unknown) => (
  error instanceof ApiError && (error.status === 401 || error.status === 403)
);

const loadWithAuthorizationFallback = async <T>(loader: () => Promise<T>, fallback: T) => {
  try {
    return await loader();
  } catch (error) {
    if (isIgnorableAuthorizationError(error)) {
      return fallback;
    }

    throw error;
  }
};

const decodePossibleMojibake = (value: string) => {
  let decoded = value;
  try {
    decoded = decodeURIComponent(escape(value));
  } catch {
    decoded = value;
  }
  const looksMojibake = /[ÃÂÆÐÑØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(value);
  const decodedHasReadableChars = /[\u4e00-\u9fffA-Za-z0-9]/.test(decoded);

  return looksMojibake && decodedHasReadableChars ? decoded : value;
};

const normalizeTodo = (todo: any): TodoItem => {
  const parsedId = Number(todo?.id);
  const parsedMentions = Number(todo?.mentions);
  const normalizedStatus = typeof todo?.status === 'string' && TODO_STATUSES.includes(todo.status as TodoStatus)
    ? todo.status as TodoStatus
    : '待跟进';

  return {
    id: Number.isFinite(parsedId) ? parsedId : Date.now(),
    type: typeof todo?.type === 'string' && todo.type.trim() ? todo.type : '产品方案',
    content: typeof todo?.content === 'string' && todo.content.trim() ? todo.content.trim() : '未填写 Todo 内容',
    mentions: Number.isFinite(parsedMentions) && parsedMentions > 0 ? parsedMentions : 1,
    dept: typeof todo?.dept === 'string' && todo.dept.trim() ? todo.dept : '产品部',
    progressText: typeof todo?.progressText === 'string' && todo.progressText.trim() ? todo.progressText.trim() : '待跟进',
    status: normalizedStatus,
    sourceModule: typeof todo?.sourceModule === 'string' && todo.sourceModule.trim() ? todo.sourceModule : undefined,
    sourceDocumentName: typeof todo?.sourceDocumentName === 'string' && todo.sourceDocumentName.trim() ? todo.sourceDocumentName : undefined,
    sourceBusinessLine: typeof todo?.sourceBusinessLine === 'string' && todo.sourceBusinessLine.trim() ? todo.sourceBusinessLine : undefined,
    createdAt: typeof todo?.createdAt === 'string' && todo.createdAt.trim() ? todo.createdAt : undefined,
    updatedAt: typeof todo?.updatedAt === 'string' && todo.updatedAt.trim() ? todo.updatedAt : undefined,
  };
};

const normalizeDocument = (document: any) => ({
  ...document,
  name: typeof document?.name === 'string' && document.name.trim()
    ? decodePossibleMojibake(document.name.trim())
    : document?.name,
  analysisResult: document?.analysisResult
    ? normalizeAnalysisResult(document.analysisResult, { sourceContent: document.content })
    : null,
});

const sortPromptVersions = (versions: PromptVersion[]) => [...versions].sort((left, right) => {
  const leftTime = Date.parse(left.date);
  const rightTime = Date.parse(right.date);

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
    return rightTime - leftTime;
  }

  return right.id.localeCompare(left.id, undefined, { numeric: true });
});

class RemoteStore {
  documents: any[] = [];
  feedbacks: any[] = [];
  todos: TodoItem[] = [];
  promptVersionsByModule: PromptVersionsByModule = createDefaultPromptVersions();
  listeners: Listener[] = [];
  loaded = false;
  private loadingPromise: Promise<void> | null = null;

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((item) => item !== listener);
    };
  }

  emit() {
    this.listeners.forEach((listener) => listener());
  }

  reset() {
    this.documents = [];
    this.feedbacks = [];
    this.todos = [];
    this.promptVersionsByModule = createDefaultPromptVersions();
    this.loaded = false;
    this.loadingPromise = null;
    this.emit();
  }

  async loadAll(force = false) {
    if (this.loadingPromise && !force) {
      return this.loadingPromise;
    }

    this.loadingPromise = (async () => {
      const [documentsResponse, todosResponse, feedbacksResponse] = await Promise.all([
        loadWithAuthorizationFallback(() => api.documents.list(), { items: [] as any[] }),
        loadWithAuthorizationFallback(() => api.todos.list(), { items: [] as any[] }),
        loadWithAuthorizationFallback(() => api.feedbacks.list(), { items: [] as any[] }),
      ]);

      const promptResults = await Promise.all(PROMPT_MODULES.map(async (module) => ({
        module,
        response: await loadWithAuthorizationFallback(() => api.promptModules.listVersions(module), { items: [] as any[] }),
      })));

      this.documents = documentsResponse.items.map(normalizeDocument);
      this.todos = todosResponse.items.map(normalizeTodo);
      this.feedbacks = feedbacksResponse.items;
      this.promptVersionsByModule = promptResults.reduce((accumulator, { module, response }) => {
        accumulator[module] = sortPromptVersions(response.items.map((item) => ({
          recordId: item.recordId,
          id: item.id,
          status: item.status,
          date: item.date,
          content: item.content,
        })));
        return accumulator;
      }, createDefaultPromptVersions());

      this.loaded = true;
      this.emit();
    })().finally(() => {
      this.loadingPromise = null;
    });

    return this.loadingPromise;
  }

  async refreshDocuments() {
    const response = await api.documents.list();
    this.documents = response.items.map(normalizeDocument);
    this.emit();
  }

  async refreshTodos() {
    const response = await api.todos.list();
    this.todos = response.items.map(normalizeTodo);
    this.emit();
  }

  async refreshFeedbacks() {
    const response = await api.feedbacks.list();
    this.feedbacks = response.items;
    this.emit();
  }

  async refreshPromptVersions(module: PromptModule) {
    const response = await api.promptModules.listVersions(module);
    this.promptVersionsByModule = {
      ...this.promptVersionsByModule,
      [module]: sortPromptVersions(response.items.map((item) => ({
        recordId: item.recordId,
        id: item.id,
        status: item.status,
        date: item.date,
        content: item.content,
      }))),
    };
    this.emit();
  }

  getPromptVersions(module: PromptModule) {
    return this.promptVersionsByModule[module].map((version) => ({ ...version }));
  }

  getPublishedPromptVersion(module: PromptModule = '用户研究') {
    return this.getPromptVersions(module).find((version) => version.status === '已发布') ?? this.getPromptVersions(module)[0] ?? null;
  }

  getPublishedPrompt(module: PromptModule = '用户研究') {
    return this.getPublishedPromptVersion(module)?.content ?? '';
  }

  async uploadDocument(file: File, businessLine: string, promptModule: PromptModule = '用户研究') {
    const response = await api.documents.upload({ file, businessLine, promptModule });
    const normalizedDocument = normalizeDocument(response.item);
    const existingIndex = this.documents.findIndex((document) => document.id === normalizedDocument.id);

    if (existingIndex >= 0) {
      this.documents = this.documents.map((document, index) => (
        index === existingIndex ? normalizedDocument : document
      ));
    } else {
      this.documents = [normalizedDocument, ...this.documents];
    }

    this.emit();
    return normalizedDocument;
  }

  async deleteDocument(id: string) {
    await api.documents.delete(id);
    this.documents = this.documents.filter((document) => document.id !== id);
    this.emit();
  }

  async updateDocument(id: string, updates: Record<string, unknown>) {
    const response = await api.documents.update(id, updates);
    const normalizedDocument = normalizeDocument(response.item);
    this.documents = this.documents.map((document) => document.id === id ? normalizedDocument : document);
    this.emit();
    return normalizedDocument;
  }

  async analyzeDocument(id: string) {
    const response = await api.documents.analyze(id);
    const normalizedDocument = normalizeDocument(response.item);
    this.documents = this.documents.map((document) => document.id === id ? normalizedDocument : document);
    this.emit();
    return normalizedDocument;
  }

  async addFeedback(feedback: Record<string, unknown>) {
    const response = await api.feedbacks.create(feedback);
    this.feedbacks = [response.item, ...this.feedbacks];
    this.emit();
    return response.item;
  }

  async updateFeedback(id: string, updates: Record<string, unknown>) {
    const response = await api.feedbacks.update(id, updates);
    this.feedbacks = this.feedbacks.map((feedback) => feedback.id === id ? response.item : feedback);
    this.emit();
    return response.item;
  }

  async addTodo(todo: Record<string, unknown>) {
    const response = await api.todos.create(todo);
    const normalizedTodo = normalizeTodo(response.item);
    this.todos = [normalizedTodo, ...this.todos];
    this.emit();
    return normalizedTodo;
  }

  async updateTodo(id: number, updates: Record<string, unknown>) {
    const response = await api.todos.update(id, updates);
    const normalizedTodo = normalizeTodo(response.item);
    this.todos = this.todos.map((todo) => todo.id === id ? normalizedTodo : todo);
    this.emit();
    return normalizedTodo;
  }

  async deleteTodo(id: number) {
    await api.todos.delete(id);
    this.todos = this.todos.filter((todo) => todo.id !== id);
    this.emit();
  }

  async createPromptVersion(module: PromptModule, content: string, status: PromptVersionStatus = '草稿') {
    await api.promptModules.createVersion(module, { content, status });
    await this.refreshPromptVersions(module);
  }

  async updatePromptVersion(module: PromptModule, recordId: string, content: string) {
    await api.promptVersions.update(recordId, { content });
    await this.refreshPromptVersions(module);
  }

  async publishPromptVersion(module: PromptModule, recordId?: string, content?: string) {
    if (recordId) {
      if (content) {
        await api.promptVersions.update(recordId, { content });
      }
      await api.promptVersions.publish(recordId);
    } else if (content) {
      await api.promptModules.createVersion(module, { content, status: '已发布' });
    }

    await this.refreshPromptVersions(module);
  }
}

export const globalStore = new RemoteStore();
