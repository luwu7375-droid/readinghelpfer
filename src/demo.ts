import 'dotenv/config';
import { AIClient } from './ai.js';
import { ReadingPipeline } from './reading.js';
import { ObsidianSync, Note } from './obsidian.js';

// 模拟章节文本
const mockChapter = `
地下室手记 - 第一章节选

我是一个病态的人……我是一个恶毒的人。我是一个令人讨厌的人。我想我的肝脏有病。可是，我对自己的病连一点也不明白，也不清楚究竟是哪里不舒服。我不治病，而且从来也没有治过，虽然我尊重医药和医生。再说，我还是极端迷信的人，至少迷信到尊重医药的程度。我受过很好的教育，因此完全能够不迷信，可是我偏偏迷信。不，我不愿治病是出于恶意。这一点你们多半是不会明白的。当然，我不能向你们说清楚，到底我是在恶意地跟谁过不去。我完全明白，我这样做，医生们绝不会给我报复似的；我明白，我首先伤害的是我自己，而不是别人。尽管如此，如果我不治病，那就是出于恶意。我的肝脏不好吗？那就让它更坏些吧！

我就是这样生活了很久——有二十年了。现在我四十岁。过去我在机关里工作，而现在不干了。我过去是一个凶恶的官吏。我粗暴无礼，因此感到快乐。

四十年的地下室生活让我意识到，人的意识有时候太多了。不但是太多，简直就是一种疾病。对于人的日常需要来说，普通的人的意识就绰绰有余了，甚至只要它的一半或者四分之一也就够了。
`;

async function main() {
  console.log('🚀 AI 阅读系统测试\n');

  const ai = new AIClient(
    process.env.CHEAP_API_KEY!,
    process.env.CHEAP_BASE_URL!,
    process.env.MAIN_API_KEY!,
    process.env.MAIN_BASE_URL!
  );

  const pipeline = new ReadingPipeline(
    ai,
    process.env.CHEAP_MODEL!,
    process.env.MAIN_MODEL!
  );

  const obsidian = new ObsidianSync(process.env.OBSIDIAN_VAULT_PATH!);

  const bookTitle = '地下室手记';
  const chapterTitle = '第一章';

  console.log(`📖 正在处理：${bookTitle} - ${chapterTitle}\n`);

  console.log('🤖 AI 阅读并划线中（使用 DeepSeek）...');
  const highlights = await pipeline.readAndHighlight(mockChapter, chapterTitle);
  console.log(`✅ 已标注 ${highlights.length} 处\n`);

  const allNotes: Note[] = [];

  for (let i = 0; i < highlights.length; i++) {
    const h = highlights[i];
    console.log(`📝 [${i + 1}/${highlights.length}] 划线：${h.text.slice(0, 40)}...`);
    console.log(`   理由：${h.reason}`);

    const context = {
      bookOutline: '陀思妥耶夫斯基的地下室手记，探讨自由意志、理性与人性的矛盾',
      chapterSummary: '主人公的自我介绍，病态、恶意与地下室生活',
      previousInsights: allNotes.map(n => n.aiComment),
      surroundingText: pipeline.extractSurrounding(mockChapter, h.position),
      highlightedText: h.text
    };

    console.log('💬 生成深度评论中（使用 Claude 3.5）...');
    const comment = await pipeline.generateComment(context);
    console.log(`✅ 评论已生成\n`);

    allNotes.push({
      chapterTitle,
      highlightedText: h.text,
      aiComment: comment,
      timestamp: new Date().toLocaleString('zh-CN')
    });
  }

  console.log('💾 同步到 Obsidian...');
  await obsidian.syncBook(bookTitle, allNotes);
  console.log(`✅ 已同步到：${process.env.OBSIDIAN_VAULT_PATH}/Reading Notes/${bookTitle}.md\n`);

  console.log('🎉 完成！生成了以���笔记：');
  allNotes.forEach((note, i) => {
    console.log(`\n${i + 1}. "${note.highlightedText.slice(0, 30)}..."`);
    console.log(`   ${note.aiComment.slice(0, 80)}...`);
  });
}

main().catch(console.error);
