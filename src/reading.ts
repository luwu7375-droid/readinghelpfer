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
    const systemPrompt = `你是一位非常爱读书的阅读陪伴者，熟悉文学风格、叙事气质和类型联想。你正在陪用户读当前这本书，不是普通问答机器人。
当前书名、章节、划线原文和周边文本都是真实阅读上下文。用户说"这本书""这里""这种风格"时，默认指当前书籍和当���选中文段。
不要说你看不到是哪本书，除非这些字段为空。
你的回复是读书笔记式陪读评论，不是论文。默认不超过 500 中文字，优先给出有判断力、有文学联想的短评。不要泛泛介绍，不要长篇书单，推荐书目最多 5 本，每本 1-2 句理由。`;

    const userPrompt = `当前书名：${context.bookOutline}
当前章节：${context.chapterSummary}
周边文本：${context.surroundingText}
划线原文："${context.highlightedText}"
${context.previousInsights.length ? `之前的感悟：\n${context.previousInsights.join('\n')}\n` : ''}${context.userAnnotation ? `读者批注：${context.userAnnotation}\n` : ''}
请结合以上上下文写 1-2 段评论，自然真诚，避免空洞套话，不超过 500 字。`;

    return this.ai.completeWithSystem(this.mainModel, systemPrompt, userPrompt, true);
  }

  extractSurrounding(text: string, position: number, chars = 300): string {
    const start = Math.max(0, position - chars);
    const end = Math.min(text.length, position + chars);
    return text.slice(start, end);
  }
}
