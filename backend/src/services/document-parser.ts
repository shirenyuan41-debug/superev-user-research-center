import fs from 'node:fs/promises';
import mammoth from 'mammoth';

type DocumentSource = {
  buffer?: Buffer;
  filePath?: string;
};

export const parseDocumentFile = async (source: DocumentSource, fileExt: string) => {
  if (fileExt === 'docx') {
    if (source.buffer) {
      const result = await mammoth.extractRawText({ buffer: source.buffer });
      return result.value.trim();
    }

    if (!source.filePath) {
      throw new Error('未找到可读取的 docx 文件');
    }

    const result = await mammoth.extractRawText({ path: source.filePath });
    return result.value.trim();
  }

  if (source.buffer) {
    return source.buffer.toString('utf8').trim();
  }

  if (!source.filePath) {
    throw new Error('未找到可读取的文本文件');
  }

  return (await fs.readFile(source.filePath, 'utf8')).trim();
};
