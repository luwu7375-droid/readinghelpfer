import 'dotenv/config';
import { KavitaClient } from './kavita.js';
import { AIClient } from './ai.js';
import { ReadingPipeline } from './reading.js';
import { ObsidianSync, Note } from './obsidian.js';
import { EpubParser } from './epub-parser.js';
import * as fs from 'fs/promises';

async function main() {
  const kavita = new KavitaClient(
    process.env.KAVITA_URL!,
    process.env.KAVITA_USERNAME!,
    process.env.KAVITA_PASSWORD!
  );

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

  console.log('📚 获取书库...');
  const libraries = await kavita.getLibraries();
  const series = await kavita.getSeries(libraries[0].id);

  console.log(`\n可用书籍：`);
  series.forEach((book: any, i: number) => {
    console.log(`${i + 1}. ${book.name}`);
  });

  const selectedBook = series[0];
  console.log(`\n📖 正在处理：${selectedBook.name}\n`);

  const volumes = await kavita.getVolumes(selectedBook.id);
  const chapter = volumes[0].chapters[0];

  console.log(`📥 下载 EPUB 文件...`);
  const epubPath = `/tmp/${selectedBook.name}.epub`;
  await kavita.downloadChapter(chapter.id, epubPath);

  console.log(`📖 解析 EPUB 章节...`);
  const epubChapters = await EpubParser.parse(epubPath);

  // 过滤掉版权页、目录等短章节，只保留正文（字数 > 2000）
  const mainChapters = epubChapters.filter(ch => ch.text.length > 2000);
  console.log(`   找到 ${mainChapters.length} 个正文章节\n`);

  const allNotes: Note[] = [];

  for (const epubChapter of mainChapters.slice(0, 1)) {
    console.log(`📖 处理：${epubChapter.title}`);
    console.log(`   字数：${epubChapter.text.length}`);

    console.log('   🤖 AI 阅读中...');
    const highlights = await pipeline.readAndHighlight(epubChapter.text, epubChapter.title);

    for (const h of highlights) {
      console.log(`\n   ✏️  划线：${h.text.slice(0, 40)}...`);
      console.log(`   理由：${h.reason}`);

      const context = {
        bookOutline: selectedBook.name,
        chapterSummary: epubChapter.title,
        previousInsights: allNotes.map(n => n.aiComment),
        surroundingText: pipeline.extractSurrounding(epubChapter.text, h.position),
        highlightedText: h.text
      };

      console.log('   💬 生成评论...');
      const comment = await pipeline.generateComment(context);

      allNotes.push({
        chapterTitle: epubChapter.title,
        highlightedText: h.text,
        aiComment: comment,
        timestamp: new Date().toLocaleString('zh-CN')
      });
    }
  }

  await fs.unlink(epubPath).catch(() => {});

  console.log('\n💾 同步到 Obsidian...');
  await obsidian.syncBook(selectedBook.name, allNotes);

  console.log('✅ 完成！');
}

main().catch(console.error);
