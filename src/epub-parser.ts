import AdmZip from 'adm-zip';
import { load } from 'cheerio';
import * as path from 'path';

export interface EpubChapterContent {
  title: string;
  text: string;
}

export class EpubParser {
  static async parse(epubPath: string): Promise<EpubChapterContent[]> {
    const zip = new AdmZip(epubPath);
    const chapters: EpubChapterContent[] = [];

    // 读取 content.opf 获取章节顺序
    const opfEntry = zip.getEntries().find(e => e.entryName.endsWith('.opf'));
    if (!opfEntry) {
      throw new Error('未找到 content.opf 文件');
    }

    const opfContent = opfEntry.getData().toString('utf8');
    const $ = load(opfContent, { xmlMode: true });

    // 获取章节顺序（从 spine 元素）
    const itemrefs = $('spine itemref');
    const orderedIds: string[] = [];
    itemrefs.each((_, elem) => {
      const idref = $(elem).attr('idref');
      if (idref) orderedIds.push(idref);
    });

    // 构建 id -> href 映射
    const manifest: Record<string, string> = {};
    $('manifest item').each((_, elem) => {
      const id = $(elem).attr('id');
      const href = $(elem).attr('href');
      if (id && href) manifest[id] = href;
    });

    // 获取 OPF 文件所在目录
    const opfDir = path.dirname(opfEntry.entryName);

    // 按顺序读取章节
    for (const id of orderedIds) {
      const href = manifest[id];
      if (!href) continue;

      const fullPath = path.join(opfDir, href).replace(/\\/g, '/');
      const entry = zip.getEntry(fullPath);
      if (!entry) continue;

      const html = entry.getData().toString('utf8');
      const $page = load(html);

      $page('script, style').remove();

      const paragraphs: string[] = [];
      $page('body').find('p, div').each((_, elem) => {
        const text = $page(elem).text().trim();
        if (text.length > 0) {
          paragraphs.push(text);
        }
      });

      const text = paragraphs.join('\n\n');

      if (text.length > 100) {
        let title = $page('title').text().trim();

        if (!title || title === '未知' || title.length < 2) {
          const h1 = $page('h1, h2, h3').first().text().trim();
          if (h1 && h1.length > 0 && h1.length < 50) {
            title = h1;
          } else {
            const firstLine = paragraphs[0]?.substring(0, 30).trim();
            if (firstLine && firstLine.length > 0) {
              title = firstLine;
            } else {
              title = `Chapter ${chapters.length + 1}`;
            }
          }
        }

        chapters.push({ title, text });
      }
    }

    return chapters;
  }
}
