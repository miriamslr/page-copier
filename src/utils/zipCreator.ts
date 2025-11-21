import JSZip from 'jszip';
import { Resource } from './resourceExtractor';

export interface CustomHeaders {
  [key: string]: string;
}

export class ZipCreator {
  private zip: JSZip;

  constructor() {
    this.zip = new JSZip();
  }

  addFile(path: string, content: string | Blob): void {
    this.zip.file(path, content);
  }

  async downloadResources(
    resources: Resource[],
    customHeaders?: CustomHeaders,
    onProgress?: (current: number, total: number) => void
  ): Promise<{ success: Resource[]; failed: Resource[] }> {
    const proxies = [
      (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    ];

    const success: Resource[] = [];
    const failed: Resource[] = [];
    const total = resources.length;

    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      let downloaded = false;

      // Tentar com cada proxy
      for (const proxyFn of proxies) {
        try {
          const proxyUrl = proxyFn(resource.url);
          const headers: HeadersInit = {
            ...customHeaders,
          };

          const response = await fetch(proxyUrl, { headers });

          if (response.ok) {
            const blob = await response.blob();
            this.zip.file(resource.localPath, blob);
            success.push(resource);
            downloaded = true;
            break;
          }
        } catch (error) {
          console.error(`Erro ao baixar ${resource.url}:`, error);
          continue;
        }
      }

      if (!downloaded) {
        failed.push(resource);
        console.warn(`Falha ao baixar: ${resource.url}`);
      }

      if (onProgress) {
        onProgress(i + 1, total);
      }
    }

    return { success, failed };
  }

  async generate(): Promise<Blob> {
    return await this.zip.generateAsync({ type: 'blob' });
  }

  async downloadZip(filename: string): Promise<void> {
    const blob = await this.generate();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
