import { useEffect, useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DOMTreeProps {
  iframeDocument: Document | null;
  selectedElement: HTMLElement | null;
  onSelectElement: (element: HTMLElement) => void;
}

interface TreeNode {
  element: HTMLElement;
  children: TreeNode[];
  isExpanded: boolean;
}

export function DOMTree({ iframeDocument, selectedElement, onSelectElement }: DOMTreeProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);

  useEffect(() => {
    if (!iframeDocument?.body) return;
    
    const buildTree = (element: HTMLElement): TreeNode => {
      const children = Array.from(element.children)
        .filter((child) => child instanceof HTMLElement)
        .map((child) => buildTree(child as HTMLElement));

      return {
        element,
        children,
        isExpanded: false,
      };
    };

    const rootNodes = Array.from(iframeDocument.body.children)
      .filter((child) => child instanceof HTMLElement)
      .map((child) => buildTree(child as HTMLElement));

    setTree(rootNodes);
  }, [iframeDocument]);

  const toggleExpand = (node: TreeNode) => {
    const updateTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map((n) => {
        if (n.element === node.element) {
          return { ...n, isExpanded: !n.isExpanded };
        }
        return { ...n, children: updateTree(n.children) };
      });
    };
    setTree(updateTree(tree));
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isSelected = selectedElement === node.element;
    const tagName = node.element.tagName.toLowerCase();
    const id = node.element.id ? `#${node.element.id}` : '';
    const classes = node.element.className ? `.${node.element.className.split(' ').join('.')}` : '';

    return (
      <div key={`${tagName}-${depth}-${Math.random()}`}>
        <div
          className={`flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-muted/50 text-sm ${
            isSelected ? 'bg-primary/10 border-l-2 border-primary' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={(e) => {
            e.stopPropagation();
            onSelectElement(node.element);
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node);
              }}
              className="p-0 h-4 w-4"
            >
              {node.isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          
          <span className="text-primary font-medium">{tagName}</span>
          {id && <span className="text-blue-600">{id}</span>}
          {classes && <span className="text-muted-foreground text-xs truncate max-w-[200px]">{classes}</span>}
        </div>
        
        {hasChildren && node.isExpanded && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 border-l bg-background flex flex-col">
      <div className="h-12 border-b px-4 flex items-center">
        <h3 className="font-semibold text-sm">Árvore DOM</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-2">
          {tree.map((node) => renderNode(node))}
        </div>
      </ScrollArea>
    </div>
  );
}
