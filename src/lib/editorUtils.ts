import DOMPurify from 'dompurify';

export interface EditorElement {
  node: HTMLElement;
  tagName: string;
  classes: string[];
  id: string;
  path: string;
}

export function getElementPath(element: HTMLElement): string {
  const path: string[] = [];
  let current: HTMLElement | null = element;
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector += `#${current.id}`;
    } else if (current.className) {
      const classes = current.className.trim().split(/\s+/).join('.');
      if (classes) selector += `.${classes}`;
    }
    path.unshift(selector);
    current = current.parentElement;
  }
  
  return path.join(' > ');
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['a', 'b', 'br', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'i', 'img', 'li', 'ol', 'p', 'span', 'strong', 'u', 'ul', 'section', 'article', 'header', 'footer', 'nav', 'button', 'input', 'label', 'form', 'table', 'tr', 'td', 'th', 'tbody', 'thead'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style', 'target', 'rel', 'type', 'placeholder', 'value', 'name'],
  });
}

export function getElementInfo(element: HTMLElement): EditorElement {
  return {
    node: element,
    tagName: element.tagName.toLowerCase(),
    classes: Array.from(element.classList),
    id: element.id || '',
    path: getElementPath(element),
  };
}

export function applyStyle(element: HTMLElement, property: string, value: string): void {
  element.style.setProperty(property, value);
}

export function getComputedStyles(element: HTMLElement): CSSStyleDeclaration {
  return window.getComputedStyle(element);
}

export function isEditableText(element: HTMLElement): boolean {
  const editableTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'DIV', 'A', 'BUTTON', 'LI'];
  return editableTags.includes(element.tagName);
}

export function isLink(element: HTMLElement): boolean {
  return element.tagName === 'A';
}
