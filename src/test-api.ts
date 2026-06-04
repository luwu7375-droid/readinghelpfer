import 'dotenv/config';
import axios from 'axios';

async function testAPIs() {
  console.log('🧪 测试 API 连接\n');

  // 测试 fuka.win (Claude)
  console.log('1️⃣ 测试 fuka.win (Claude 3.5 Sonnet)...');
  try {
    const { data } = await axios.post('https://api.fuka.win/v1/chat/completions', {
      model: 'claude-3.5-sonnet',
      messages: [{ role: 'user', content: '你好，请回复"测试成功"' }],
      max_tokens: 50
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.MAIN_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ fuka.win 连接成功');
    console.log(`   响应：${data.choices[0].message.content}\n`);
  } catch (e: any) {
    console.log(`❌ fuka.win 失败：${e.response?.status} - ${e.response?.data?.error?.message || e.message}\n`);
  }

  // 测试 OpenRouter (DeepSeek)
  console.log('2️⃣ 测试 OpenRouter (DeepSeek)...');
  try {
    const { data } = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'deepseek/deepseek-chat',
      messages: [{ role: 'user', content: '你好，请回复"测试成功"' }]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.CHEAP_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/ai-reading-system',
        'X-Title': 'AI Reading System'
      }
    });
    console.log('✅ OpenRouter 连接成功');
    console.log(`   响应：${data.choices[0].message.content}\n`);
  } catch (e: any) {
    console.log(`❌ OpenRouter 失败：${e.response?.status} - ${JSON.stringify(e.response?.data)}\n`);
  }
}

testAPIs();
