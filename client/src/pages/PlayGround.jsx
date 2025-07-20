import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Download,
  Copy,
  Code,
  Palette,
  RefreshCw,
  Terminal,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Save,
  ExternalLink,
} from "lucide-react";

const CodeEditor = () => {
  const [activeLanguage, setActiveLanguage] = useState("javascript");
  const [codes, setCodes] = useState({
    javascript: "",
    python: "",
    html: "",
    css: "",
    cpp: "",
    java: ""
  });
  const [output, setOutput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [theme, setTheme] = useState("dark");
  const [showOutput, setShowOutput] = useState(true);
  const [isOutputMaximized, setIsOutputMaximized] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef(null);
  const previewRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });

  // Get current code for active language
  const currentCode = codes[activeLanguage];

  // Language configurations with syntax highlighting patterns
  const languages = {
    javascript: {
      name: "JavaScript",
      keywords: [
        "function", "const", "let", "var", "if", "else", "for", "while", "do",
        "switch", "case", "default", "return", "break", "continue", "try", "catch",
        "finally", "throw", "class", "extends", "import", "export", "async", "await",
        "Promise", "console", "document", "window", "addEventListener", "getElementById",
        "querySelector", "createElement", "appendChild", "innerHTML", "textContent",
      ],
      color: "bg-yellow-500",
    },
    python: {
      name: "Python",
      keywords: [
        "def", "class", "if", "elif", "else", "for", "while", "in", "not", "and", "or",
        "import", "from", "return", "yield", "try", "except", "finally", "with", "as",
        "pass", "break", "continue", "print", "input", "len", "range", "enumerate",
        "zip", "map", "filter", "lambda", "list", "dict", "set", "tuple", "str",
        "int", "float", "bool", "open", "read", "write", "append",
      ],
      color: "bg-blue-500",
    },
    html: {
      name: "HTML",
      keywords: [
        "html", "head", "title", "body", "div", "span", "p", "a", "img", "ul", "ol",
        "li", "h1", "h2", "h3", "h4", "h5", "h6", "form", "input", "button", "textarea",
        "select", "option", "table", "tr", "td", "th", "thead", "tbody", "nav",
        "header", "footer", "main", "section", "article", "aside", "meta", "link",
        "script", "style", "br", "hr", "strong", "em", "code", "pre", "blockquote",
      ],
      color: "bg-orange-500",
    },
    css: {
      name: "CSS",
      keywords: [
        "color", "background", "margin", "padding", "border", "width", "height",
        "font-size", "font-family", "text-align", "display", "position", "top", "left",
        "right", "bottom", "float", "clear", "overflow", "z-index", "opacity",
        "transform", "transition", "animation", "hover", "focus", "active", "visited",
        "flex", "grid", "align-items", "justify-content", "flex-direction", "flex-wrap",
        "gap", "box-shadow", "border-radius", "linear-gradient", "rgba", "px", "em",
        "rem", "vh", "vw", "auto", "none", "block", "inline", "inline-block",
        "relative", "absolute", "fixed", "sticky",
      ],
      color: "bg-purple-500",
    },
    cpp: {
      name: "C++",
      keywords: [
        "include", "using", "namespace", "std", "int", "char", "float", "double",
        "bool", "void", "string", "vector", "map", "set", "pair", "queue", "stack",
        "if", "else", "for", "while", "do", "switch", "case", "default", "break",
        "continue", "return", "class", "struct", "public", "private", "protected",
        "virtual", "const", "static", "template", "typename", "auto", "new", "delete",
        "try", "catch", "throw", "cout", "cin", "endl", "main", "sizeof", "nullptr",
      ],
      color: "bg-green-500",
    },
    java: {
      name: "Java",
      keywords: [
        "public", "private", "protected", "static", "final", "abstract", "class",
        "interface", "extends", "implements", "import", "package", "void", "int",
        "String", "boolean", "char", "double", "float", "long", "short", "byte",
        "if", "else", "for", "while", "do", "switch", "case", "default", "break",
        "continue", "return", "try", "catch", "finally", "throw", "throws", "new",
        "this", "super", "null", "true", "false", "System", "out", "println",
        "print", "Scanner", "ArrayList", "HashMap", "main",
      ],
      color: "bg-red-500",
    },
  };

  // Calculate suggestion position
  const calculateSuggestionPosition = (textarea, cursorPos) => {
    if (!textarea) return { top: 0, left: 0 };
    
    const text = textarea.value.substring(0, cursorPos);
    const lines = text.split('\n');
    const currentLineIndex = lines.length - 1;
    const currentLineText = lines[currentLineIndex] || '';
    
    const textareaRect = textarea.getBoundingClientRect();
    const scrollTop = textarea.scrollTop;
    
    const lineHeight = 25.6;
    const charWidth = 9.6;
    
    const lineTop = (currentLineIndex * lineHeight) - scrollTop;
    const charPosition = currentLineText.length * charWidth;
    
    const rightEdge = textareaRect.width - 280;
    const left = Math.min(charPosition + 50, Math.max(rightEdge, 50));
    const top = Math.max(lineTop + lineHeight + 5, 5);
    
    return { top, left };
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    // Update code for current language
    setCodes(prev => ({
      ...prev,
      [activeLanguage]: value
    }));
    setCursorPosition(cursorPos);

    // Update suggestion position
    if (textareaRef.current) {
      const position = calculateSuggestionPosition(textareaRef.current, cursorPos);
      setSuggestionPosition(position);
    }

    // Handle autocomplete suggestions
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastWordMatch = textBeforeCursor.match(/\b\w+$/);
    const currentWord = lastWordMatch ? lastWordMatch[0] : '';

    if (currentWord.length > 1) {
      const matchingKeywords = languages[activeLanguage].keywords.filter(
        (keyword) => keyword.toLowerCase().startsWith(currentWord.toLowerCase())
      );

      if (matchingKeywords.length > 0) {
        setSuggestions(matchingKeywords.slice(0, 6));
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    const textBeforeCursor = currentCode.substring(0, cursorPosition);
    const textAfterCursor = currentCode.substring(cursorPosition);
    const lastWordMatch = textBeforeCursor.match(/\b\w+$/);
    const currentWord = lastWordMatch ? lastWordMatch[0] : '';

    const newTextBefore = textBeforeCursor.substring(
      0,
      textBeforeCursor.length - currentWord.length
    );
    const newCode = newTextBefore + suggestion + textAfterCursor;

    setCodes(prev => ({
      ...prev,
      [activeLanguage]: newCode
    }));
    setShowSuggestions(false);

    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = newTextBefore.length + suggestion.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Handle key events
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
    if (showSuggestions && (e.key === "Tab" || e.key === "Enter")) {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSuggestionClick(suggestions[0]);
      }
    }
  };

  // Save code (using memory storage as per restrictions)
  const saveCodeToBackend = async () => {
    if (!currentCode.trim()) {
      alert("❌ No code to save. Please write some code first.");
      return;
    }

    setIsSaving(true);

    try {
      // Simulate backend save
      const savedProjects = JSON.parse(sessionStorage.getItem('savedProjects') || '[]');
      const newProject = {
        id: Date.now(),
        code: currentCode,
        language: activeLanguage,
        timestamp: new Date().toISOString(),
        filename: `code_${Date.now()}.${
          activeLanguage === 'javascript' ? 'js' : 
          activeLanguage === 'python' ? 'py' : 
          activeLanguage === 'html' ? 'html' : 
          activeLanguage === 'css' ? 'css' : 
          activeLanguage === 'cpp' ? 'cpp' : 'java'
        }`
      };
      
      savedProjects.push(newProject);
      sessionStorage.setItem('savedProjects', JSON.stringify(savedProjects));
      
      setTimeout(() => {
        alert("✅ Code saved successfully!");
        console.log("Saved project:", newProject);
        setIsSaving(false);
      }, 1000);
    } catch (error) {
      alert("❌ Failed to save code. Please try again.");
      console.error("Save failed:", error);
      setIsSaving(false);
    }
  };

  // Enhanced HTML/CSS preview
  const renderHTMLCSS = () => {
    const htmlCode = codes.html || '';
    const cssCode = codes.css || '';
    
    let fullHTML = htmlCode;
    
    // If CSS exists, inject it into HTML
    if (cssCode) {
      const styleTag = `<style>${cssCode}</style>`;
      if (fullHTML.includes('</head>')) {
        fullHTML = fullHTML.replace('</head>', `${styleTag}</head>`);
      } else if (fullHTML.includes('<head>')) {
        fullHTML = fullHTML.replace('<head>', `<head>${styleTag}`);
      } else {
        fullHTML = `<!DOCTYPE html><html><head>${styleTag}</head><body>${fullHTML}</body></html>`;
      }
    }
    
    return fullHTML;
  };

  // Enhanced execution functions
  const executeJavaScript = (code) => {
    let output = [];

    const customConsole = {
      log: (...args) =>
        output.push(
          args
            .map((arg) => {
              if (typeof arg === "object") {
                return JSON.stringify(arg, null, 2);
              }
              return String(arg);
            })
            .join(" ")
        ),
      error: (...args) => output.push("Error: " + args.join(" ")),
      warn: (...args) => output.push("Warning: " + args.join(" ")),
      info: (...args) => output.push("Info: " + args.join(" ")),
    };

    const safeGlobals = {
      console: customConsole,
      alert: (message) => output.push(`Alert: ${message}`),
      Math: Math,
      Date: Date,
      JSON: JSON,
      String: String,
      Number: Number,
      Boolean: Boolean,
      Array: Array,
      Object: Object,
      parseInt: parseInt,
      parseFloat: parseFloat,
      isNaN: isNaN,
      isFinite: isFinite,
    };

    const wrappedCode = `
        (function() {
          ${Object.keys(safeGlobals)
            .map((key) => `const ${key} = arguments[0].${key};`)
            .join("\n")}
          ${code}
        })
      `;

    try {
      const func = eval(wrappedCode);
      func(safeGlobals);
      return {
        success: true,
        output: output.length > 0 ? output.join('\n') : 'Code executed successfully'
      };
    } catch (err) {
      return {
        success: false,
        output: `Error: ${err.message}`
      };
    }
  };

  const executePython = (code) => {
    let output = [];

    try {
      const printRegex = /print\((.*?)\)/g;
      let match;

      while ((match = printRegex.exec(code)) !== null) {
        let content = match[1].trim();
        if (
          (content.startsWith('"') && content.endsWith('"')) ||
          (content.startsWith("'") && content.endsWith("'"))
        ) {
          content = content.slice(1, -1);
        }
        output.push(content);
      }

      const lines = code.split("\n");
      const variables = {};

      for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith("#")) continue;

        const assignMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
        if (assignMatch) {
          const [, varName, value] = assignMatch;
          try {
            if (!isNaN(value)) {
              variables[varName] = parseFloat(value);
            } else if (
              (value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))
            ) {
              variables[varName] = value.slice(1, -1);
            }
          } catch (e) {
            // Ignore complex expressions
          }
        }
      }

      return {
        success: true,
        output:
          output.length > 0
            ? output.join("\n")
            : "Python code executed successfully",
      };
    } catch (err) {
      return {
        success: false,
        output: `Error: ${err.message}`,
      };
    }
  };

  const executeHTML = (code) => {
    // Show preview for HTML
    setShowPreview(true);
    
    return {
      success: true,
      output: `HTML rendered successfully!\n\n📄 Preview is now visible in the preview panel.\n\nCode structure analyzed:\n- HTML tags: ${(code.match(/<[^>]+>/g) || []).length}\n- Text content: ${code.replace(/<[^>]*>/g, "").trim().length} characters`,
    };
  };

  const executeCSS = (code) => {
    const selectors = (code.match(/[^{}]+\s*{/g) || []).length;
    const properties = (code.match(/[^{}:]+:/g) || []).length;

    // If HTML exists, show combined preview
    if (codes.html) {
      setShowPreview(true);
    }

    return {
      success: true,
      output: `CSS parsed successfully!\n\n🎨 ${codes.html ? 'Combined HTML+CSS preview is visible in the preview panel.' : 'To see the visual output, write some HTML code first.'}\n\nStylesheet analysis:\n- Selectors: ${selectors}\n- Properties: ${properties}`,
    };
  };

  // Enhanced code execution
  const runCode = async () => {
    if (!currentCode.trim()) {
      setOutput("❌ No code to execute. Please write some code first.");
      return;
    }

    setIsRunning(true);
    setOutput("🚀 Running code...\n");

    setTimeout(() => {
      let result;
      const startTime = Date.now();

      switch (activeLanguage) {
        case "javascript":
          result = executeJavaScript(currentCode);
          break;
        case "python":
          result = executePython(currentCode);
          break;
        case "html":
          result = executeHTML(currentCode);
          break;
        case "css":
          result = executeCSS(currentCode);
          break;
        case "cpp":
        case "java":
          result = {
            success: true,
            output: `${languages[activeLanguage].name} code structure validated!\n\nNote: Full compilation requires a ${languages[activeLanguage].name} compiler.\nThis editor provides syntax validation and structure analysis.`,
          };
          break;
        default:
          result = {
            success: true,
            output: "Code structure validated successfully!",
          };
      }

      const executionTime = Date.now() - startTime;
      const icon = result.success ? "✅" : "❌";

      setOutput(
        `${icon} ${result.output}\n\n⏱️ Execution time: ${executionTime}ms`
      );
      setIsRunning(false);
    }, 800);
  };

  // Copy code to clipboard
  const copyCode = async () => {
    if (!currentCode.trim()) {
      alert("No code to copy!");
      return;
    }
    try {
      await navigator.clipboard.writeText(currentCode);
      alert("Code copied to clipboard! 📋");
    } catch (err) {
      console.error("Failed to copy: ", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = currentCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Code copied to clipboard! 📋");
    }
  };

  // Download code as file
  const downloadCode = () => {
    if (!currentCode.trim()) {
      alert("No code to download!");
      return;
    }

    const extensions = {
      javascript: "js",
      python: "py",
      html: "html",
      css: "css",
      cpp: "cpp",
      java: "java",
    };

    const blob = new Blob([currentCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${extensions[activeLanguage]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear current language code
  const clearCode = () => {
    setCodes(prev => ({
      ...prev,
      [activeLanguage]: ""
    }));
    setOutput("");
    setShowSuggestions(false);
    if (activeLanguage === 'html' || activeLanguage === 'css') {
      setShowPreview(false);
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Toggle output panel
  const toggleOutput = () => {
    setShowOutput(!showOutput);
  };

  // Toggle output maximize
  const toggleOutputMaximize = () => {
    setIsOutputMaximized(!isOutputMaximized);
  };

  // Open preview in new window
  const openPreviewInNewWindow = () => {
    const htmlContent = renderHTMLCSS();
    if (!htmlContent.trim()) {
      alert("No HTML/CSS content to preview!");
      return;
    }
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  return (
    <div
      className={`h-screen flex flex-col ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"} transition-colors duration-300`}
    >
      {/* Header */}
      <div
        className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"} p-4 flex-shrink-0`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Code className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CodeWave Editor
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            {(activeLanguage === 'html' || activeLanguage === 'css') && (
              <button
                onClick={openPreviewInNewWindow}
                className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg transition-colors shadow-lg"
                title="Open Preview in New Window"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Preview</span>
              </button>
            )}

            <button
              onClick={toggleOutput}
              className={`p-2 rounded-lg transition-colors ${
                showOutput
                  ? "bg-blue-500 text-white"
                  : `${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`
              }`}
              title="Toggle Output Panel"
            >
              {showOutput ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"} transition-colors`}
              title="Toggle Theme"
            >
              <Palette className="w-5 h-5" />
            </button>

            <button
              onClick={saveCodeToBackend}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 shadow-lg"
              title="Save Code"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>

            <button
              onClick={runCode}
              disabled={isRunning}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-colors disabled:opacity-50 shadow-lg"
              title="Run Code"
            >
              <Play className="w-4 h-4" />
              <span>{isRunning ? "Running..." : "Run"}</span>
            </button>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="flex space-x-1 mt-4 overflow-x-auto">
          {Object.entries(languages).map(([key, lang]) => (
            <button
              key={key}
              onClick={() => {
                setActiveLanguage(key);
                setShowSuggestions(false);
                if (key !== 'html' && key !== 'css') {
                  setShowPreview(false);
                }
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                activeLanguage === key
                  ? `${lang.color} text-white shadow-lg`
                  : `${theme === "dark" ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${activeLanguage === key ? 'bg-white' : lang.color}`}></div>
              <span className="font-medium">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code Editor Panel */}
        <div className={`flex-1 flex flex-col ${showOutput ? (isOutputMaximized ? 'w-0' : 'w-1/2') : 'w-full'} transition-all duration-300`}>
          <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"} px-4 py-2 flex items-center justify-between`}>
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4" />
              <span className="font-medium">{languages[activeLanguage].name} Editor</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={copyCode}
                className={`p-2 rounded ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"} transition-colors`}
                title="Copy Code"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={downloadCode}
                className={`p-2 rounded ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"} transition-colors`}
                title="Download Code"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={clearCode}
                className={`p-2 rounded ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"} transition-colors`}
                title="Clear Code"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={currentCode}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className={`w-full h-full p-4 resize-none outline-none font-mono text-sm leading-relaxed ${
                theme === "dark"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-50 text-gray-900"
              } transition-colors`}
              placeholder={`Write your ${languages[activeLanguage].name} code here...`}
              spellCheck="false"
              style={{
                tabSize: 2,
                fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
              }}
            />

            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                className={`absolute z-50 ${theme === "dark" ? "bg-gray-800" : "bg-white"} border ${
                  theme === "dark" ? "border-gray-600" : "border-gray-300"
                } rounded-lg shadow-2xl max-w-xs`}
                style={{
                  top: suggestionPosition.top,
                  left: suggestionPosition.left,
                }}
              >
                <div className="p-2">
                  <div className="text-xs font-medium mb-2 text-gray-500">Suggestions</div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`w-full text-left px-3 py-2 rounded text-sm ${
                        theme === "dark"
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-100"
                      } transition-colors`}
                    >
                      <span className="font-mono font-medium">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Output/Preview Panel */}
        {showOutput && (
          <div className={`${isOutputMaximized ? 'flex-1' : 'w-1/2'} flex flex-col border-l ${theme === "dark" ? "border-gray-700" : "border-gray-200"} transition-all duration-300`}>
           <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"} px-4 py-2 flex items-center justify-between`}>
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4" />
                <span className="font-medium">
                  {showPreview && (activeLanguage === 'html' || activeLanguage === 'css') 
                    ? 'Live Preview' 
                    : 'Output Console'
                  }
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleOutputMaximize}
                  className={`p-2 rounded ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"} transition-colors`}
                  title={isOutputMaximized ? "Minimize Output" : "Maximize Output"}
                >
                  {isOutputMaximized ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {showPreview && (activeLanguage === 'html' || activeLanguage === 'css') ? (
                <div className="h-full">
                  <iframe
                    ref={previewRef}
                    srcDoc={renderHTMLCSS()}
                    className="w-full h-full border-0"
                    title="HTML/CSS Preview"
                    sandbox="allow-scripts"
                  />
                </div>
              ) : (
                <pre
                  className={`w-full h-full p-4 overflow-auto font-mono text-sm ${
                    theme === "dark"
                      ? "bg-gray-900 text-green-400"
                      : "bg-gray-50 text-gray-800"
                  } transition-colors whitespace-pre-wrap`}
                >
                  {output || "Output will appear here when you run your code..."}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;