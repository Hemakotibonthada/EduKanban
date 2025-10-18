import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Save,
  Download,
  Upload,
  RotateCcw,
  Copy,
  Check,
  Settings,
  Code,
  Terminal,
  FileCode,
  Folder,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  Maximize2,
  Minimize2
} from 'lucide-react';
import toast from 'react-hot-toast';

const getBackendURL = () => {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
};

/**
 * Workground Component
 * Interactive code playground for practicing programming
 * 
 * Features:
 * - Multi-language support (JavaScript, Python, HTML/CSS, Java, C++)
 * - Live code execution
 * - Save/load workground sessions
 * - Code templates and snippets
 * - Output console
 * - File management
 * - Theme customization
 */
const Workground = () => {
  // State management
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState(14);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [files, setFiles] = useState([
    { id: 1, name: 'main.js', language: 'javascript', content: '', active: true }
  ]);
  const [activeFileId, setActiveFileId] = useState(1);

  const editorRef = useRef(null);
  const token = localStorage.getItem('token');

  // Language configurations
  const languages = [
    { value: 'javascript', label: 'JavaScript', icon: '🟨', extension: '.js' },
    { value: 'python', label: 'Python', icon: '🐍', extension: '.py' },
    { value: 'html', label: 'HTML/CSS', icon: '🌐', extension: '.html' },
    { value: 'java', label: 'Java', icon: '☕', extension: '.java' },
    { value: 'cpp', label: 'C++', icon: '⚙️', extension: '.cpp' },
    { value: 'typescript', label: 'TypeScript', icon: '🔷', extension: '.ts' }
  ];

  // Code templates
  const templates = {
    javascript: `// JavaScript Playground
console.log("Hello, World!");

// Try some code here
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("Developer"));`,
    
    python: `# Python Playground
print("Hello, World!")

# Try some code here
def greet(name):
    return f"Hello, {name}!"

print(greet("Developer"))`,
    
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Playground</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello, World!</h1>
        <p>Start building your HTML page here!</p>
    </div>
</body>
</html>`,
    
    java: `// Java Playground
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Try some code here
        String message = greet("Developer");
        System.out.println(message);
    }
    
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}`,
    
    cpp: `// C++ Playground
#include <iostream>
#include <string>

using namespace std;

string greet(string name) {
    return "Hello, " + name + "!";
}

int main() {
    cout << "Hello, World!" << endl;
    
    // Try some code here
    string message = greet("Developer");
    cout << message << endl;
    
    return 0;
}`,
    
    typescript: `// TypeScript Playground
console.log("Hello, World!");

// Try some code here
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("Developer"));`
  };

  // Load template when language changes
  useEffect(() => {
    if (!code || code.trim() === '') {
      setCode(templates[language] || '');
    }
  }, [language]);

  // Get active file
  const activeFile = files.find(f => f.id === activeFileId);

  // Update code when switching files
  useEffect(() => {
    if (activeFile) {
      setCode(activeFile.content);
      setLanguage(activeFile.language);
    }
  }, [activeFileId]);

  // Save current file content
  const saveCurrentFile = () => {
    setFiles(files.map(f => 
      f.id === activeFileId 
        ? { ...f, content: code, language } 
        : f
    ));
  };

  // Run code
  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running code...\n');
    saveCurrentFile();

    try {
      if (language === 'javascript') {
        // Execute JavaScript locally
        const logs = [];
        const originalLog = console.log;
        console.log = (...args) => {
          logs.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
        };

        try {
          // eslint-disable-next-line no-eval
          eval(code);
          console.log = originalLog;
          setOutput(logs.join('\n') || 'Code executed successfully (no output)');
        } catch (error) {
          console.log = originalLog;
          setOutput(`Error: ${error.message}\n${error.stack}`);
        }
      } else if (language === 'html') {
        // Render HTML in iframe
        setOutput('HTML rendered in preview below');
        const iframe = document.getElementById('html-preview');
        if (iframe) {
          iframe.srcdoc = code;
        }
      } else {
        // For other languages, send to backend for execution
        const response = await fetch(`${getBackendURL()}/api/workground/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ code, language })
        });

        const data = await response.json();
        
        if (data.success) {
          setOutput(data.output || 'Code executed successfully (no output)');
        } else {
          setOutput(`Error: ${data.message || 'Execution failed'}`);
        }
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Save workground session
  const saveWorkground = async () => {
    if (!token) {
      toast.error('Please login to save your workground');
      return;
    }

    setIsSaving(true);
    saveCurrentFile();

    try {
      const response = await fetch(`${getBackendURL()}/api/workground/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: activeFile?.name || 'Untitled',
          language,
          files: files.map(f => ({
            name: f.name,
            language: f.language,
            content: f.id === activeFileId ? code : f.content
          }))
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Workground saved successfully!');
      } else {
        toast.error(data.message || 'Failed to save workground');
      }
    } catch (error) {
      toast.error('Failed to save workground');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Copy code to clipboard
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Download code
  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile?.name || `code${languages.find(l => l.value === language)?.extension || '.txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Code downloaded!');
  };

  // Reset code
  const resetCode = () => {
    if (confirm('Are you sure you want to reset the code? This cannot be undone.')) {
      setCode(templates[language] || '');
      setOutput('');
      toast.success('Code reset to template');
    }
  };

  // Add new file
  const addNewFile = () => {
    const newId = Math.max(...files.map(f => f.id)) + 1;
    const ext = languages.find(l => l.value === language)?.extension || '.txt';
    setFiles([...files, {
      id: newId,
      name: `file${newId}${ext}`,
      language,
      content: templates[language] || '',
      active: false
    }]);
    setActiveFileId(newId);
  };

  // Remove file
  const removeFile = (fileId) => {
    if (files.length === 1) {
      toast.error('Cannot remove the last file');
      return;
    }
    setFiles(files.filter(f => f.id !== fileId));
    if (activeFileId === fileId) {
      setActiveFileId(files.find(f => f.id !== fileId)?.id || files[0].id);
    }
  };

  return (
    <div className={`h-screen flex flex-col bg-gray-900 text-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Code className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold">Workground</h1>
          </div>
          
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {languages.map(lang => (
              <option key={lang.value} value={lang.value}>
                {lang.icon} {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={runCode}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            {isRunning ? 'Running...' : 'Run'}
          </button>

          <button
            onClick={saveWorkground}
            disabled={isSaving}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Save"
          >
            <Save className="w-5 h-5" />
          </button>

          <button
            onClick={copyCode}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Copy"
          >
            {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
          </button>

          <button
            onClick={downloadCode}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            onClick={resetCode}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* File Tabs */}
      <div className="flex items-center gap-2 px-6 py-2 bg-gray-800 border-b border-gray-700 overflow-x-auto">
        {files.map(file => (
          <div
            key={file.id}
            className={`flex items-center gap-2 px-3 py-1 rounded-t-lg cursor-pointer ${
              activeFileId === file.id
                ? 'bg-gray-900 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => {
              saveCurrentFile();
              setActiveFileId(file.id);
            }}
          >
            <FileCode className="w-4 h-4" />
            <span className="text-sm">{file.name}</span>
            {files.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
                className="p-0.5 hover:bg-red-600 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        
        <button
          onClick={addNewFile}
          className="flex items-center gap-1 px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded"
        >
          <Plus className="w-4 h-4" />
          New
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          <textarea
            ref={editorRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 p-4 bg-gray-900 text-white font-mono resize-none focus:outline-none"
            style={{ fontSize: `${fontSize}px`, lineHeight: '1.5', tabSize: 4 }}
            spellCheck={false}
            placeholder="Start coding here..."
          />
        </div>

        {/* Output Panel */}
        <div className="w-1/3 border-l border-gray-700 flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
            <Terminal className="w-4 h-4 text-green-400" />
            <span className="font-semibold">Output</span>
          </div>
          
          {language === 'html' ? (
            <iframe
              id="html-preview"
              className="flex-1 bg-white"
              title="HTML Preview"
              sandbox="allow-scripts"
            />
          ) : (
            <pre className="flex-1 p-4 bg-gray-900 text-green-400 font-mono text-sm overflow-auto whitespace-pre-wrap">
              {output || 'Output will appear here...'}
            </pre>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-6 py-2 bg-gray-800 border-t border-gray-700 text-sm text-gray-400">
        <div className="flex items-center gap-4">
          <span>Language: {languages.find(l => l.value === language)?.label}</span>
          <span>|</span>
          <span>Lines: {code.split('\n').length}</span>
          <span>|</span>
          <span>Characters: {code.length}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span>Font Size:</span>
          <button
            onClick={() => setFontSize(Math.max(10, fontSize - 1))}
            className="px-2 py-1 hover:bg-gray-700 rounded"
          >
            -
          </button>
          <span>{fontSize}px</span>
          <button
            onClick={() => setFontSize(Math.min(24, fontSize + 1))}
            className="px-2 py-1 hover:bg-gray-700 rounded"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default Workground;
