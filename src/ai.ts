import axios from 'axios';

export class AIClient {
  constructor(
    private cheapApiKey: string,
    private cheapBaseUrl: string,
    private mainApiKey: string,
    private mainBaseUrl: string
  ) {}

  async complete(model: string, prompt: string, useMainModel = false): Promise<string> {
    const baseURL = useMainModel ? this.mainBaseUrl : this.cheapBaseUrl;
    const apiKey = useMainModel ? this.mainApiKey : this.cheapApiKey;

    const { data } = await axios.post(`${baseURL}/chat/completions`, {
      model,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    return data.choices[0].message.content;
  }
}
