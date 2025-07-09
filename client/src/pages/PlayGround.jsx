import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Save,
  Download,
  Copy,
  Settings,
  Code,
  Palette,
  RefreshCw,
} from "lucide-react";

const CodeEditor = () => {
  const [activeLanguage, setActiveLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [theme, setTheme] = useState("dark");
  const textareaRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);

  // Language configurations with keywords and templates
  const languages = {
    javascript: {
      name: "JavaScript",
      keywords: [
        "function",
        "const",
        "let",
        "var",
        "if",
        "else",
        "for",
        "while",
        "do",
        "switch",
        "case",
        "default",
        "return",
        "break",
        "continue",
        "try",
        "catch",
        "finally",
        "throw",
        "class",
        "extends",
        "import",
        "export",
        "async",
        "await",
        "Promise",
        "console",
        "document",
        "window",
        "addEventListener",
        "getElementById",
        "querySelector",
        "createElement",
        "appendChild",
        "innerHTML",
        "textContent",
      ],
      template: `// Welcome to JavaScript Editor
function greetStudent(name) {
    console.log("Hello, " + name + "!");
    return "Learning JavaScript is fun!";
}

const studentName = "Coder";
const message = greetStudent(studentName);
console.log(message);`,
      color: "bg-yellow-500",
    },
    python: {
      name: "Python",
      keywords: [
        "def",
        "class",
        "if",
        "elif",
        "else",
        "for",
        "while",
        "in",
        "not",
        "and",
        "or",
        "import",
        "from",
        "return",
        "yield",
        "try",
        "except",
        "finally",
        "with",
        "as",
        "pass",
        "break",
        "continue",
        "print",
        "input",
        "len",
        "range",
        "enumerate",
        "zip",
        "map",
        "filter",
        "lambda",
        "list",
        "dict",
        "set",
        "tuple",
        "str",
        "int",
        "float",
        "bool",
        "open",
        "read",
        "write",
        "append",
      ],
      template: `# Welcome to Python Editor
def greet_student(name):
    """Greet a student learning Python"""
    print(f"Hello, {name}!")
    return "Learning Python is awesome!"

def calculate_grade(score):
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    else:
        return "Study harder!"

student_name = "Coder"
message = greet_student(student_name)
print(message)

# Example with lists and loops
numbers = [1, 2, 3, 4, 5]
for num in numbers:
    print(f"Number: {num}")`,
      color: "bg-blue-500",
    },
    html: {
      name: "HTML",
      keywords: [
        "html",
        "head",
        "title",
        "body",
        "div",
        "span",
        "p",
        "a",
        "img",
        "ul",
        "ol",
        "li",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "form",
        "input",
        "button",
        "textarea",
        "select",
        "option",
        "table",
        "tr",
        "td",
        "th",
        "thead",
        "tbody",
        "nav",
        "header",
        "footer",
        "main",
        "section",
        "article",
        "aside",
        "meta",
        "link",
        "script",
        "style",
        "br",
        "hr",
        "strong",
        "em",
        "code",
        "pre",
        "blockquote",
      ],
      template: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student's First Website</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f0f0f0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .highlight {
            background-color: #ffeb3b;
            padding: 2px 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to My Learning Journey!</h1>
        <p>This is my <span class="highlight">first HTML page</span> as a student.</p>
        
        <h2>What I'm Learning:</h2>
        <ul>
            <li>HTML Structure</li>
            <li>CSS Styling</li>
            <li>JavaScript Programming</li>
        </ul>
        
        <h2>Contact Form:</h2>
        <form>
            <input type="text" placeholder="Your Name" required>
            <textarea placeholder="Your Message" rows="4"></textarea>
            <button type="submit">Send Message</button>
        </form>
    </div>
</body>
</html>`,
      color: "bg-orange-500",
    },
    css: {
      name: "CSS",
      keywords: [
        "color",
        "background",
        "margin",
        "padding",
        "border",
        "width",
        "height",
        "font-size",
        "font-family",
        "text-align",
        "display",
        "position",
        "top",
        "left",
        "right",
        "bottom",
        "float",
        "clear",
        "overflow",
        "z-index",
        "opacity",
        "transform",
        "transition",
        "animation",
        "hover",
        "focus",
        "active",
        "visited",
        "flex",
        "grid",
        "align-items",
        "justify-content",
        "flex-direction",
        "flex-wrap",
        "gap",
        "box-shadow",
        "border-radius",
        "linear-gradient",
        "rgba",
        "px",
        "em",
        "rem",
        "vh",
        "vw",
        "auto",
        "none",
        "block",
        "inline",
        "inline-block",
        "relative",
        "absolute",
        "fixed",
        "sticky",
      ],
      template: `/* Welcome to CSS Editor */
/* Reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

/* Header styles */
.header {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 15px;
    padding: 30px;
    text-align: center;
    margin-bottom: 30px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.header h1 {
    font-size: 2.5em;
    color: white;
    margin-bottom: 10px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.header p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.1em;
}

/* Card styles */
.card {
    background: white;
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 20px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
}

/* Button styles */
.button {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    transition: background 0.3s ease;
}

.button:hover {
    background: #45a049;
    transform: scale(1.05);
}

/* Responsive design */
@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
    
    .header h1 {
        font-size: 2em;
    }
    
    .card {
        padding: 15px;
    }
}`,
      color: "bg-purple-500",
    },
    cpp: {
      name: "C++",
      keywords: [
        "include",
        "using",
        "namespace",
        "std",
        "int",
        "char",
        "float",
        "double",
        "bool",
        "void",
        "string",
        "vector",
        "map",
        "set",
        "pair",
        "queue",
        "stack",
        "priority_queue",
        "if",
        "else",
        "for",
        "while",
        "do",
        "switch",
        "case",
        "default",
        "break",
        "continue",
        "return",
        "class",
        "struct",
        "public",
        "private",
        "protected",
        "virtual",
        "override",
        "const",
        "static",
        "template",
        "typename",
        "auto",
        "new",
        "delete",
        "try",
        "catch",
        "throw",
        "cout",
        "cin",
        "endl",
        "main",
        "sizeof",
        "nullptr",
      ],
      template: `// Welcome to C++ Editor
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

// Function to greet student
void greetStudent(const string& name) {
    cout << "Hello, " << name << "!" << endl;
    cout << "Welcome to C++ programming!" << endl;
}

// Class example
class Student {
private:
    string name;
    int age;
    vector<int> grades;

public:
    Student(const string& n, int a) : name(n), age(a) {}
    
    void addGrade(int grade) {
        grades.push_back(grade);
    }
    
    double calculateAverage() const {
        if (grades.empty()) return 0.0;
        int sum = 0;
        for (int grade : grades) {
            sum += grade;
        }
        return static_cast<double>(sum) / grades.size();
    }
    
    void displayInfo() const {
        cout << "Name: " << name << ", Age: " << age << endl;
        cout << "Average Grade: " << calculateAverage() << endl;
    }
};

int main() {
    // Welcome message
    greetStudent("C++ Learner");
    
    // Create student object
    Student student("Alice", 20);
    student.addGrade(85);
    student.addGrade(92);
    student.addGrade(78);
    
    // Display student info
    student.displayInfo();
    
    // Array and loop example
    vector<int> numbers = {1, 2, 3, 4, 5};
    cout << "Numbers: ";
    for (int num : numbers) {
        cout << num << " ";
    }
    cout << endl;
    
    return 0;
}`,
      color: "bg-green-500",
    },
    java: {
      name: "Java",
      keywords: [
        "public",
        "private",
        "protected",
        "static",
        "final",
        "abstract",
        "class",
        "interface",
        "extends",
        "implements",
        "import",
        "package",
        "void",
        "int",
        "String",
        "boolean",
        "char",
        "double",
        "float",
        "long",
        "short",
        "byte",
        "if",
        "else",
        "for",
        "while",
        "do",
        "switch",
        "case",
        "default",
        "break",
        "continue",
        "return",
        "try",
        "catch",
        "finally",
        "throw",
        "throws",
        "new",
        "this",
        "super",
        "null",
        "true",
        "false",
        "System",
        "out",
        "println",
        "print",
        "Scanner",
        "ArrayList",
        "HashMap",
        "main",
      ],
      template: `// Welcome to Java Editor
import java.util.*;

public class StudentLearning {
    
    // Method to greet student
    public static void greetStudent(String name) {
        System.out.println("Hello, " + name + "!");
        System.out.println("Welcome to Java programming!");
    }
    
    // Student class
    static class Student {
        private String name;
        private int age;
        private ArrayList<Integer> grades;
        
        public Student(String name, int age) {
            this.name = name;
            this.age = age;
            this.grades = new ArrayList<>();
        }
        
        public void addGrade(int grade) {
            grades.add(grade);
        }
        
        public double calculateAverage() {
            if (grades.isEmpty()) return 0.0;
            int sum = 0;
            for (int grade : grades) {
                sum += grade;
            }
            return (double) sum / grades.size();
        }
        
        public void displayInfo() {
            System.out.println("Name: " + name + ", Age: " + age);
            System.out.println("Average Grade: " + calculateAverage());
        }
    }
    
    public static void main(String[] args) {
        // Welcome message
        greetStudent("Java Learner");
        
        // Create student object
        Student student = new Student("Bob", 19);
        student.addGrade(88);
        student.addGrade(94);
        student.addGrade(82);
        
        // Display student info
        student.displayInfo();
        
        // Array and loop example
        int[] numbers = {1, 2, 3, 4, 5};
        System.out.print("Numbers: ");
        for (int num : numbers) {
            System.out.print(num + " ");
        }
        System.out.println();
        
        // Collections example
        ArrayList<String> subjects = new ArrayList<>();
        subjects.add("Math");
        subjects.add("Physics");
        subjects.add("Chemistry");
        
        System.out.println("Subjects: " + subjects);
    }
}`,
      color: "bg-red-500",
    },
  };

  // Initialize with template when language changes
  useEffect(() => {
    if (!code) {
      setCode(languages[activeLanguage].template);
    }
  }, [activeLanguage]);

  // Handle text input and suggestions
  const handleInputChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    setCode(value);
    setCursorPosition(cursorPos);

    // Get word at cursor position
    const textBeforeCursor = value.substring(0, cursorPos);
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1];

    if (currentWord.length > 0) {
      const matchingKeywords = languages[activeLanguage].keywords.filter(
        (keyword) => keyword.toLowerCase().startsWith(currentWord.toLowerCase())
      );

      if (matchingKeywords.length > 0) {
        setSuggestions(matchingKeywords.slice(0, 8));
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const selectSuggestion = (suggestion) => {
    const textBeforeCursor = code.substring(0, cursorPosition);
    const textAfterCursor = code.substring(cursorPosition);
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1];

    const beforeWord = textBeforeCursor.substring(
      0,
      textBeforeCursor.lastIndexOf(currentWord)
    );
    const newCode = beforeWord + suggestion + textAfterCursor;

    setCode(newCode);
    setShowSuggestions(false);

    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current.focus();
      const newCursorPos = beforeWord.length + suggestion.length;
      textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Simulate code execution
  const runCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      if (activeLanguage === "javascript") {
        setOutput(
          "✓ JavaScript code executed successfully!\n→ Check browser console for output"
        );
      } else if (activeLanguage === "python") {
        setOutput(
          "✓ Python code executed successfully!\n→ Hello, Coder!\n→ Learning Python is awesome!\n→ Number: 1\n→ Number: 2\n→ Number: 3\n→ Number: 4\n→ Number: 5"
        );
      } else if (activeLanguage === "html") {
        setOutput(
          "✓ HTML rendered successfully!\n→ Check preview panel for output"
        );
      } else if (activeLanguage === "css") {
        setOutput(
          "✓ CSS compiled successfully!\n→ Styles applied to HTML elements"
        );
      } else if (activeLanguage === "cpp") {
        setOutput(
          "✓ C++ compiled and executed successfully!\n→ Hello, C++ Learner!\n→ Welcome to C++ programming!\n→ Name: Alice, Age: 20\n→ Average Grade: 85\n→ Numbers: 1 2 3 4 5"
        );
      } else if (activeLanguage === "java") {
        setOutput(
          "✓ Java compiled and executed successfully!\n→ Hello, Java Learner!\n→ Welcome to Java programming!\n→ Name: Bob, Age: 19\n→ Average Grade: 88\n→ Numbers: 1 2 3 4 5\n→ Subjects: [Math, Physics, Chemistry]"
        );
      }
    }, 1500);
  };

  // Download code
  const downloadCode = () => {
    const extensions = {
      javascript: "js",
      python: "py",
      html: "html",
      css: "css",
      cpp: "cpp",
      java: "java",
    };

    const element = document.createElement("a");
    const file = new Blob([code], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `code.${extensions[activeLanguage]}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Copy code to clipboard
  const copyCode = () => {
    navigator.clipboard.writeText(code);
  };

  // Load template
  const loadTemplate = () => {
    setCode(languages[activeLanguage].template);
    setOutput("");
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <div
        className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} shadow-lg border-b ${
          theme === "dark" ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Code className="h-8 w-8 text-blue-500" />
                <h1 className="text-2xl font-bold">Student Code Editor</h1>
              </div>

              {/* Language Selector */}
              <div className="flex space-x-2">
                {Object.entries(languages).map(([key, lang]) => (
                  <button
                    key={key}
                    onClick={() => setActiveLanguage(key)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      activeLanguage === key
                        ? `${lang.color} text-white`
                        : theme === "dark"
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`p-2 rounded-lg ${
                theme === "dark"
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <Palette className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Code Editor */}
          <div className="lg:col-span-2">
            <div
              className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg shadow-lg overflow-hidden`}
            >
              {/* Toolbar */}
              <div
                className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"} px-4 py-3 border-b ${
                  theme === "dark" ? "border-gray-600" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {languages[activeLanguage].name} Editor
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full ${languages[activeLanguage].color}`}
                    ></div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={loadTemplate}
                      className="p-2 rounded hover:bg-gray-600 transition-colors"
                      title="Load Template"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={copyCode}
                      className="p-2 rounded hover:bg-gray-600 transition-colors"
                      title="Copy Code"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={downloadCode}
                      className="p-2 rounded hover:bg-gray-600 transition-colors"
                      title="Download Code"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Code Input Area */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={handleInputChange}
                  className={`w-full h-96 p-4 font-mono text-sm resize-none focus:outline-none ${
                    theme === "dark"
                      ? "bg-gray-900 text-green-400 placeholder-gray-500"
                      : "bg-gray-50 text-gray-900 placeholder-gray-400"
                  }`}
                  placeholder={`Start coding in ${languages[activeLanguage].name}...`}
                  spellCheck="false"
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    className={`absolute z-10 mt-1 ml-4 ${
                      theme === "dark"
                        ? "bg-gray-800 border-gray-600"
                        : "bg-white border-gray-300"
                    } border rounded-lg shadow-lg max-h-48 overflow-y-auto`}
                  >
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => selectSuggestion(suggestion)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-500 hover:text-white transition-colors ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        <span className="font-mono">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Run Button */}
              <div
                className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"} px-4 py-3 border-t ${
                  theme === "dark" ? "border-gray-600" : "border-gray-200"
                }`}
              >
                <button
                  onClick={runCode}
                  disabled={isRunning}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isRunning
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  <Play className="h-4 w-4" />
                  <span>{isRunning ? "Running..." : "Run Code"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Output Panel */}
          <div className="space-y-6">
            {/* Output */}
            <div
              className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg shadow-lg overflow-hidden`}
            >
              <div
                className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"} px-4 py-3 border-b ${
                  theme === "dark" ? "border-gray-600" : "border-gray-200"
                }`}
              >
                <h3 className="text-lg font-semibold">Output</h3>
              </div>

              <div className="p-4">
                <pre
                  className={`font-mono text-sm whitespace-pre-wrap ${
                    theme === "dark" ? "text-green-400" : "text-gray-800"
                  }`}
                >
                  {output || 'Click "Run Code" to see output here...'}
                </pre>
              </div>
            </div>

            {/* Keywords Reference */}
            <div
              className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg shadow-lg overflow-hidden`}
            >
              <div
                className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"} px-4 py-3 border-b ${
                  theme === "dark" ? "border-gray-600" : "border-gray-200"
                }`}
              >
                <h3 className="text-lg font-semibold">
                  Keywords & Suggestions
                </h3>
              </div>

              <div className="p-4 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {languages[activeLanguage].keywords.map((keyword, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const newCode = code + keyword;
                        setCode(newCode);
                        textareaRef.current.focus();
                      }}
                      className={`text-left px-2 py-1 rounded text-sm font-mono transition-colors ${
                        theme === "dark"
                          ? "hover:bg-gray-700 text-blue-400"
                          : "hover:bg-gray-100 text-blue-600"
                      }`}
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tips */}
            <div
              className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg shadow-lg p-4`}
            >
              <h3 className="text-lg font-semibold mb-3">
                💡 Tips for Students
              </h3>
              <ul className="space-y-2 text-sm">
                <li>• Start typing to see keyword suggestions</li>
                <li>• Use Ctrl+Space for autocomplete</li>
                <li>• Click on keywords to insert them</li>
                <li>• Save your work frequently</li>
                <li>• Experiment with different languages</li>
                <li>• Practice makes perfect!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
