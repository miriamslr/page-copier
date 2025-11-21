export interface Resource {
  url: string;
  type: 'css' | 'js' | 'image' | 'other';
  localPath: string;
}

export class ResourceExtractor {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private normalizeUrl(url: string): string {
    try {
      // Se já é uma URL completa, retorna
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }

      // Se é um caminho absoluto
      if (url.startsWith('/')) {
        const base = new URL(this.baseUrl);
        return `${base.protocol}//${base.host}${url}`;
      }

      // Se é um caminho relativo
      return new URL(url, this.baseUrl).href;
    } catch {
      return '';
    }
  }

  extractResources(html: string): Resource[] {
    const resources: Resource[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extrair CSS (links e imports)
    doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {
        const normalizedUrl = this.normalizeUrl(href);
        if (normalizedUrl) {
          resources.push({
            url: normalizedUrl,
            type: 'css',
            localPath: this.getLocalPath(normalizedUrl, 'css'),
          });
        }
      }
    });

    // Extrair JavaScript
    doc.querySelectorAll('script[src]').forEach((script) => {
      const src = script.getAttribute('src');
      if (src) {
        const normalizedUrl = this.normalizeUrl(src);
        if (normalizedUrl) {
          resources.push({
            url: normalizedUrl,
            type: 'js',
            localPath: this.getLocalPath(normalizedUrl, 'js'),
          });
        }
      }
    });

    // Extrair imagens
    doc.querySelectorAll('img[src]').forEach((img) => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        const normalizedUrl = this.normalizeUrl(src);
        if (normalizedUrl) {
          resources.push({
            url: normalizedUrl,
            type: 'image',
            localPath: this.getLocalPath(normalizedUrl, 'images'),
          });
        }
      }
    });

    // Extrair backgrounds de CSS inline
    doc.querySelectorAll('[style*="background"]').forEach((el) => {
      const style = el.getAttribute('style') || '';
      const urlMatches = style.match(/url\(['"]?([^'")\s]+)['"]?\)/g);
      if (urlMatches) {
        urlMatches.forEach((match) => {
          const url = match.match(/url\(['"]?([^'")\s]+)['"]?\)/)?.[1];
          if (url && !url.startsWith('data:')) {
            const normalizedUrl = this.normalizeUrl(url);
            if (normalizedUrl) {
              resources.push({
                url: normalizedUrl,
                type: 'image',
                localPath: this.getLocalPath(normalizedUrl, 'images'),
              });
            }
          }
        });
      }
    });

    return resources;
  }

  private getLocalPath(url: string, folder: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || 'file';
      return `${folder}/${filename}`;
    } catch {
      return `${folder}/file-${Date.now()}`;
    }
  }

  updateHtmlPaths(html: string, resources: Resource[]): string {
    let updatedHtml = html;

    resources.forEach((resource) => {
      // Substituir URLs absolutas e relativas
      updatedHtml = updatedHtml.replace(
        new RegExp(resource.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        resource.localPath
      );
    });

    return updatedHtml;
  }
}
