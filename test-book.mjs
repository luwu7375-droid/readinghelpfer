import { EpubParser } from './src/epub-parser.js';

const chapters = await EpubParser.parse('/tmp/reading-books/动物园 (乙一) (z-library.sk, 1lib.sk, z-lib.sk).epub');
console.log('Total chapters:', chapters.length);
chapters.slice(0, 5).forEach((ch, i) => {
  console.log(`Chapter ${i}: ${ch.title.substring(0, 50)}`);
  console.log(`Text length: ${ch.text.length}`);
  console.log('First 200 chars:', ch.text.substring(0, 200));
  console.log('---');
});
