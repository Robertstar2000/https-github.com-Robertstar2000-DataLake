import React, { useState, useEffect } from 'react';
import Card from './Card';

interface HelpModalProps {
  show: boolean;
  onClose: () => void;
}

// Simple Markdown Parser and Renderer
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const renderLine = (line: string, index: number) => {
    // Headings
    if (line.startsWith('## ')) return <h2 key={index} className="text-2xl font-bold text-white mt-6 mb-2">{line.substring(3)}</h2>;
    if (line.startsWith('# ')) return <h1 key={index} className="text-3xl font-bold text-cyan-400 mb-4">{line.substring(2)}</h1>;
    if (line.startsWith('### ')) return <h3 key={index} className="text-xl font-semibold text-cyan-300 mt-4 mb-2">{line.substring(4)}</h3>;
    
    // Horizontal Rule
    if (line.startsWith('---')) return <hr key={index} className="border-slate-600 my-6" />;

    // List items
    if (line.startsWith('- ')) return <li key={index} className="ml-6 list-disc text-slate-300">{renderInline(line.substring(2))}</li>;
    
    // Plain paragraph
    return <p key={index} className="text-slate-300 mb-2">{renderInline(line)}</p>;
  };
  
  const renderInline = (text: string) => {
    // Bold, Italic, Code
    const parts = text
      .split(/(\*\*.*?\*\*|`.*?`)/g)
      .filter(Boolean);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-slate-900 text-cyan-300 font-mono text-sm px-1.5 py-0.5 rounded">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  const lines = content.split('\n');
  const elements = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isListItem = line.startsWith('- ');
    
    if (isListItem && !inList) {
      // Start of a new list
      inList = true;
      elements.push(<ul key={`ul-start-${i}`} className="space-y-1 mb-4">{renderLine(line, i)}</ul>);
    } else if (isListItem && inList) {
      // Continue list - find the last ul and append to it
      const lastElement = elements[elements.length - 1];
      if (lastElement.type === 'ul') {
          const newChildren = React.Children.toArray(lastElement.props.children);
          newChildren.push(renderLine(line, i));
          elements[elements.length - 1] = React.cloneElement(lastElement, {}, newChildren);
      }
    } else {
      // Not a list item, end any current list
      inList = false;
      elements.push(renderLine(line, i));
    }
  }

  return <div>{elements}</div>;
};

const HelpModal: React.FC<HelpModalProps> = ({ show, onClose }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (show) {
      setIsLoading(true);
      fetch('/helpme.md')
        .then(res => {
            if (!res.ok) throw new Error("File not found");
            return res.text();
        })
        .then(text => {
            setContent(text);
            setIsLoading(false);
        })
        .catch(err => {
            setContent("Error: Could not load help content.");
            console.error(err);
            setIsLoading(false);
        });
    }
  }, [show]);

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <Card 
        className="max-w-4xl w-full h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-none flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-white">Help & User Guide</h1>
            <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white font-bold"
                aria-label="Close help modal"
            >
                &times;
            </button>
        </div>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4">
            {isLoading ? <p>Loading help content...</p> : <MarkdownRenderer content={content} />}
        </div>
      </Card>
    </div>
  );
};

export default HelpModal;
