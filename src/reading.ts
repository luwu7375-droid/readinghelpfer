import { AIClient } from './ai.js';

export interface Highlight {
  text: string;
  position: number;
  reason: string;
}

export interface ReadingContext {
  bookOutline: string;
  chapterSummary: string;
  previousInsights: string[];
  surroundingText: string;
  highlightedText: string;
  userAnnotation?: string;
}

export class ReadingPipeline {
  constructor(
    private ai: AIClient,
    private cheapModel: string,
    private mainModel: string
  ) {}

  async readAndHighlight(chapterText: string, chapterTitle: string): Promise<Highlight[]> {
    const prompt = `你是一位专注的读者。阅读以下章节《${chapterTitle}》，标出 3-5 处值得深思的句子。

要求：
- 选择有深度、能引发思考的句子
- 避免选择纯描写或过渡性文字
- 每处标注说明选择理由（1 句话）

章节内容：
${chapterText}

返回 JSON 格式：
[{"text": "句子原文", "position": 字符位置, "reason": "选择理由"}]`;

    const response = await this.ai.complete(this.cheapModel, prompt, false);
    // 去掉 AI 返回的 markdown 代码块包装（```json ... ```）
    const cleaned = response.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  }

  async generateComment(context: ReadingContext): Promise<string> {
    const prompt = `你是一位深度读者。基于以下上下文写 1-2 段评论：

【全书大纲】
${context.bookOutline}

【当前章节摘要】
${context.chapterSummary}

【你之前的感悟】
${context.previousInsights.join('\n') || '（首次阅读）'}

【划线前后文】
${context.surroundingText}

【划线文字】
"${context.highlightedText}"

${context.userAnnotation ? `【读者批注】\n${context.userAnnotation}\n` : ''}
要求：
- 结合上下文和个人理解
- 避免空洞套话
- 自然真诚`;

    return this.ai.complete(this.mainModel, prompt, true);
  }

  extractSurrounding(text: string, position: number, chars = 300): string {
    const start = Math.max(0, position - chars);
    const end = Math.min(text.length, position + chars);
    return text.slice(start, end);
  }
}
