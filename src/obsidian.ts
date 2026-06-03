import fs from 'fs/promises';
import path from 'path';

export interface Note {
  chapterTitle: string;
  highlightedText: string;
  aiComment: string;
  userAnnotation?: string;
  timestamp: string;
}

export class ObsidianSync {
  constructor(private vaultPath: string) {}

  async syncBook(bookTitle: string, notes: Note[]) {
    const fileName = `${bookTitle.replace(/[/\\?%*:|"<>]/g, '-')}.md`;
    const filePath = path.join(this.vaultPath, 'Reading Notes', fileName);

    let content = `# ${bookTitle}\n\n`;
    content += `> 最后更新：${new Date().toLocaleString('zh-CN')}\n\n`;

    for (const note of notes) {
      content += `## ${note.chapterTitle}\n\n`;
      content += `> ${note.highlightedText}\n\n`;
      content += `${note.aiComment}\n\n`;
      if (note.userAnnotation) {
        content += `**我的批注**：${note.userAnnotation}\n\n`;
      }
      content += `*${note.timestamp}*\n\n---\n\n`;
    }

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }
}
