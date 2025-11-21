import { resourceCache } from "./resourceCache";

export class Base64Embedder {
  private customHeaders: Record<string, string>;

  constructor(customHeaders: Record<string, string> = {}) {
    this.customHeaders = customHeaders;
  }

  async fetchResourceAsBase64(url: string): Promise<string | null> {
    try {
      // Verificar cache primeiro
      const cached = await resourceCache.get(url);
      if (cached?.base64) {
        return cached.base64;
      }

      // Tentar baixar com proxies
      const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
      ];

      for (const proxyUrl of proxies) {
        try {
          const response = await fetch(proxyUrl, { headers: this.customHeaders });
          if (!response.ok) continue;

          const blob = await response.blob();
          const base64 = await this.blobToBase64(blob);
          
          // Salvar no cache
          await resourceCache.set({
            url,
            content: "",
            type: blob.type,
            timestamp: Date.now(),
            base64,
          });

          return base64;
        } catch {
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error(`Erro ao baixar recurso ${url}:`, error);
      return null;
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async embedResourcesInHtml(html: string, baseUrl: string): Promise<string> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Processar imagens
    const images = Array.from(doc.querySelectorAll("img[src]"));
    for (const img of images) {
      const src = img.getAttribute("src");
      if (src && !src.startsWith("data:")) {
        const absoluteUrl = new URL(src, baseUrl).href;
        const base64 = await this.fetchResourceAsBase64(absoluteUrl);
        if (base64) {
          img.setAttribute("src", base64);
        }
      }
    }

    // Processar CSS inline (background-image)
    const elementsWithBg = Array.from(doc.querySelectorAll("[style*='background']"));
    for (const el of elementsWithBg) {
      const style = el.getAttribute("style") || "";
      const urlMatches = style.match(/url\(['"]?([^'")\s]+)['"]?\)/g);
      
      if (urlMatches) {
        let newStyle = style;
        for (const match of urlMatches) {
          const url = match.match(/url\(['"]?([^'")\s]+)['"]?\)/)?.[1];
          if (url && !url.startsWith("data:")) {
            const absoluteUrl = new URL(url, baseUrl).href;
            const base64 = await this.fetchResourceAsBase64(absoluteUrl);
            if (base64) {
              newStyle = newStyle.replace(url, base64);
            }
          }
        }
        el.setAttribute("style", newStyle);
      }
    }

    // Processar CSS externos
    const linkElements = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
    for (const link of linkElements) {
      const href = link.getAttribute("href");
      if (href) {
        const absoluteUrl = new URL(href, baseUrl).href;
        
        try {
          const cached = await resourceCache.get(absoluteUrl);
          let cssContent = cached?.content;

          if (!cssContent) {
            // Baixar CSS
            const proxies = [
              `https://api.allorigins.win/raw?url=${encodeURIComponent(absoluteUrl)}`,
              `https://corsproxy.io/?${encodeURIComponent(absoluteUrl)}`,
            ];

            for (const proxyUrl of proxies) {
              try {
                const response = await fetch(proxyUrl, { headers: this.customHeaders });
                if (response.ok) {
                  cssContent = await response.text();
                  await resourceCache.set({
                    url: absoluteUrl,
                    content: cssContent,
                    type: "text/css",
                    timestamp: Date.now(),
                  });
                  break;
                }
              } catch {
                continue;
              }
            }
          }

          if (cssContent) {
            // Criar style tag inline
            const styleTag = doc.createElement("style");
            styleTag.textContent = cssContent;
            link.replaceWith(styleTag);
          }
        } catch (error) {
          console.error(`Erro ao processar CSS ${absoluteUrl}:`, error);
        }
      }
    }

    return doc.documentElement.outerHTML;
  }
}
