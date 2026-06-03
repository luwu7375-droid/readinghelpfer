import * as fs from 'fs/promises';
import * as path from 'path';
import { EpubParser } from './epub-parser.js';

export interface BookChapter {
  title: string;
  text: string;
}

export class BookParser {
  static async parse(filePath: string): Promise<BookChapter[]> {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.epub':
        return EpubParser.parse(filePath);

      case '.txt':
        return this.parseTxt(filePath);

      case '.mobi':
      case '.azw3':
        return this.parseMobiAzw(filePath);

      default:
        throw new Error(`Unsupported format: ${ext}`);
    }
  }

  private static async parseTxt(filePath: string): Promise<BookChapter[]> {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const chapters: BookChapter[] = [];
    let currentChapter = { title: '', text: '' };
    let chapterNum = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      // 匹配多种章节标题格式
      if (/^(第[一二三四五六七八九十百千0-9]+[章节回部]|Chapter\s+\d+|CHAPTER\s+\d+|[0-9]+[\s\.、])(.*)$/i.test(trimmed) && trimmed.length < 50) {
        if (currentChapter.text.length > 100) {
          chapters.push(currentChapter);
        }
        chapterNum++;
        currentChapter = { title: trimmed || `Chapter ${chapterNum}`, text: '' };
      } else if (trimmed) {
        currentChapter.text += line + '\n';
      }
    }

    if (currentChapter.text.length > 100) {
      chapters.push(currentChapter);
    }

    // 如果没有识别到章节，尝试按空行分割
    if (chapters.length === 0) {
      const sections = content.split(/\n\s*\n\s*\n/);
      sections.forEach((section, i) => {
        const lines = section.trim().split('\n');
        if (lines.length > 0 && section.length > 200) {
          chapters.push({
            title: lines[0].substring(0, 30) || `Section ${i + 1}`,
            text: section
          });
        }
      });
    }

    return chapters.length > 0 ? chapters : [{ title: 'Full Text', text: content }];
  }

  private static async parseMobiAzw(filePath: string): Promise<BookChapter[]> {
    return [{
      title: '格式不支持',
      text: 'MOBI 和 AZW3 格式需要专门的解析工具。\n\n建议：\n1. 使用 Calibre 将文件转换为 EPUB 格式\n2. 或者将文件转换为 TXT 格式后重新上传\n\n转换方法：\n- 下载 Calibre: https://calibre-ebook.com\n- 添加书籍到 Calibre\n- 右键点击书籍 → 转换书籍 → 选择 EPUB 或 TXT 格式'
    }];
  }
}
