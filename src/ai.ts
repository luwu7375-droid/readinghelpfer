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

  async completeWithSystem(model: string, systemPrompt: string, userPrompt: string, useMainModel = false): Promise<string> {
    const baseURL = useMainModel ? this.mainBaseUrl : this.cheapBaseUrl;
    const apiKey = useMainModel ? this.mainApiKey : this.cheapApiKey;

    const { data } = await axios.post(`${baseURL}/chat/completions`, {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    return data.choices[0].message.content;
  }

  async chat(model: string, systemPrompt: string, history: Array<{ role: string; content: string }>, useMainModel = false): Promise<string> {
    const baseURL = useMainModel ? this.mainBaseUrl : this.cheapBaseUrl;
    const apiKey = useMainModel ? this.mainApiKey : this.cheapApiKey;

    const { data } = await axios.post(`${baseURL}/chat/completions`, {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    return data.choices[0].message.content;
  }
}
