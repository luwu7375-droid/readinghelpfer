import axios, { AxiosInstance } from 'axios';

export interface Book {
  id: number;
  name: string;
  summary?: string;
}

export interface Chapter {
  id: number;
  title: string;
  number: string;
  pages: number;
  volumeId: number;
  wordCount: number;
}

export interface Volume {
  id: number;
  number: number;
  chapters: Chapter[];
}

export interface EpubChapter {
  title: string;
  page: number;
}

export interface Bookmark {
  id: number;
  page: number;
  seriesId: number;
  chapterId: number;
}

export class KavitaClient {
  private client: AxiosInstance;
  private token?: string;

  constructor(
    private baseURL: string,
    private username: string,
    private password: string
  ) {
    this.client = axios.create({ baseURL });
  }

  private async ensureAuthenticated() {
    if (!this.token) {
      const { data } = await axios.post(`${this.baseURL}/api/account/login`, {
        username: this.username,
        password: this.password
      });
      this.token = data.token;
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  async getLibraries() {
    await this.ensureAuthenticated();
    const { data } = await this.client.get('/api/library');
    return data;
  }

  async getSeries(libraryId: number) {
    await this.ensureAuthenticated();
    const { data } = await this.client.post('/api/series/v2', {});
    return data;
  }

  async getVolumes(seriesId: number): Promise<Volume[]> {
    await this.ensureAuthenticated();
    const { data } = await this.client.get(`/api/series/volumes?seriesId=${seriesId}`);
    return data;
  }

  async getEpubChapters(chapterId: number): Promise<EpubChapter[]> {
    await this.ensureAuthenticated();
    const { data } = await this.client.get(`/api/book/${chapterId}/chapters`);
    return data;
  }

  async downloadChapter(chapterId: number, outputPath: string): Promise<void> {
    await this.ensureAuthenticated();
    const { data } = await this.client.get(`/api/download/chapter?chapterId=${chapterId}`, {
      responseType: 'arraybuffer'
    });
    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, data);
  }
}
