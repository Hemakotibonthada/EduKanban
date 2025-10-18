import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

/**
 * Markdown Message Component
 * Renders markdown content with syntax highlighting, tables, and copy functionality
 */
const MarkdownMessage = ({ content, className = '' }) => {
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Custom heading rendering
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 border-b pb-2" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold mt-5 mb-3 text-gray-800" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-800" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base font-semibold mt-3 mb-2 text-gray-700" {...props} />
          ),

          // Paragraph with proper spacing
          p: ({ node, ...props }) => (
            <p className="mb-4 leading-relaxed text-gray-700" {...props} />
          ),

          // Lists
          ul: ({ node, ...props }) => (
            <ul className="mb-4 ml-6 space-y-2 list-disc text-gray-700" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="mb-4 ml-6 space-y-2 list-decimal text-gray-700" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed" {...props} />
          ),

          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote 
              className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-gray-700 italic" 
              {...props} 
            />
          ),

          // Links
          a: ({ node, ...props }) => (
            <a 
              className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors" 
              target="_blank"
              rel="noopener noreferrer"
              {...props} 
            />
          ),

          // Inline code
          code: ({ node, inline, className, children, ...props }) => {
            const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
            const codeContent = String(children).replace(/\n$/, '');
            
            if (inline) {
              return (
                <code 
                  className="px-1.5 py-0.5 bg-gray-100 text-red-600 rounded text-sm font-mono" 
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // Code block with copy button
            return (
              <div className="relative group my-4">
                <button
                  onClick={() => copyToClipboard(codeContent, codeId)}
                  className="absolute right-2 top-2 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Copy code"
                >
                  {copiedCode === codeId ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <code 
                  className={`block p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm font-mono ${className || ''}`}
                  {...props}
                >
                  {children}
                </code>
              </div>
            );
          },

          // Pre tag (wraps code blocks)
          pre: ({ node, ...props }) => (
            <pre className="my-4" {...props} />
          ),

          // Tables
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-gray-300" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-100" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="border-b border-gray-300 hover:bg-gray-50" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-2 text-left font-semibold text-gray-900 border border-gray-300" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2 text-gray-700 border border-gray-300" {...props} />
          ),

          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-t-2 border-gray-200" {...props} />
          ),

          // Strong/Bold
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-gray-900" {...props} />
          ),

          // Emphasis/Italic
          em: ({ node, ...props }) => (
            <em className="italic text-gray-800" {...props} />
          ),

          // Delete/Strikethrough
          del: ({ node, ...props }) => (
            <del className="line-through text-gray-500" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;
