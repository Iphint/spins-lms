import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import '../../utils/monacoSetup';
import {
  Play, RotateCcw, Save, CheckCircle2, XCircle, Copy, Check,
  Terminal, Globe, BookOpen, AlertCircle, Sparkles, Send,
  Maximize2, Minimize2, HelpCircle, Code2, Layers, Download,
  FileCode, CheckCheck, GitBranch, Cpu, Sun, Moon
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { executePython, executeTurtleScript } from './CodeRunnerEngine';
import TurtleCanvas from './TurtleCanvas';
import api from '../../utils/api';

export default function CodePlayground({
  language = 'python',
  starterCode = '',
  materialId = null,
  worksheetId = null,
  title = 'Praktik Coding Mandiri',
  testCases = [],
  teacherNotes = null,
  isTestMode = false,
  onSubmit = null,
  submission = null,
}) {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('console'); // 'console' | 'turtle' | 'preview' | 'tests' | 'notes'
  const [turtleCommands, setTurtleCommands] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const editorRef = useRef(null);

  let appThemeContext = null;
  try {
    appThemeContext = useTheme();
  } catch {
    // fallback if context is not available
  }
  const isAppDark = appThemeContext ? appThemeContext.isDark : true;

  const [editorTheme, setEditorTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('monaco_editor_theme');
      if (saved === 'vs-dark' || saved === 'light') return saved;
    }
    return isAppDark ? 'vs-dark' : 'light';
  });

  const isDarkTheme = editorTheme === 'vs-dark';

  const toggleEditorTheme = () => {
    const nextTheme = editorTheme === 'vs-dark' ? 'light' : 'vs-dark';
    setEditorTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('monaco_editor_theme', nextTheme);
    }
  };

  // Detect mode & capabilities
  const isTurtle = language === 'turtle' || /import\s+turtle|from\s+turtle/.test(code);
  const isWeb = language === 'html' || language === 'web';
  const hasTests = Array.isArray(testCases) && testCases.length > 0;

  // Load saved project from server or local storage
  useEffect(() => {
    let isMounted = true;
    async function loadSavedProject() {
      // If worksheet submission exists, prioritize it
      if (submission?.submittedCode) {
        setCode(submission.submittedCode);
        if (submission.codeOutput) setOutput(submission.codeOutput);
        return;
      }

      // Check material project on server
      if (materialId) {
        try {
          const saved = await api.get(`/api/student-portal/projects/${materialId}`);
          if (isMounted && saved && saved.code) {
            setCode(saved.code);
            if (saved.codeOutput) setOutput(saved.codeOutput);
            setSaveStatus('Draf project dimuat dari server');
            setTimeout(() => setSaveStatus(''), 3000);
            return;
          }
        } catch {
          // fallback to localStorage
        }
      }

      // Local storage fallback
      const localKey = materialId
        ? `project_${materialId}`
        : worksheetId
        ? `ws_draft_${worksheetId}`
        : null;

      if (localKey) {
        const localCode = localStorage.getItem(localKey);
        if (localCode) setCode(localCode);
      }
    }

    loadSavedProject();
    return () => { isMounted = false; };
  }, [materialId, worksheetId, submission]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });
  };

  // Run Code logic
  const handleRunCode = async () => {
    setIsRunning(true);
    setSaveStatus('');

    const currentCode = editorRef.current ? editorRef.current.getValue() : code;
    setCode(currentCode);

    try {
      if (isWeb) {
        setOutput('Halaman web dirender pada tab Live Preview.');
        setActiveTab('preview');
        setIsRunning(false);
        return;
      }

      if (isTurtle) {
        const res = executeTurtleScript(currentCode);
        setTurtleCommands(res.commands);
        setOutput(res.output);
        setActiveTab('turtle');
        setIsRunning(false);
        return;
      }

      // 1. Try running via Backend real Python 3 first
      let executed = false;
      try {
        const response = await api.post('/api/student-portal/run-code', {
          code: currentCode,
          language: 'python',
        });
        if (response && response.output !== undefined) {
          setOutput(response.output);
          setActiveTab('console');
          executed = true;
        }
      } catch {
        // Backend unavailable or error, will fallback to client-side engine
      }

      // 2. Client-side transpiler & runtime fallback
      if (!executed) {
        const res = executePython(currentCode);
        setOutput(res.output);
        setActiveTab('console');
      }
    } catch (err) {
      setOutput(`Execution Error:\n${err.message}`);
      setActiveTab('console');
    } finally {
      setIsRunning(false);
    }
  };

  // Automated Test Cases Runner
  const handleRunTests = async () => {
    if (!hasTests) return;
    setIsRunning(true);
    setActiveTab('tests');

    const currentCode = editorRef.current ? editorRef.current.getValue() : code;
    setCode(currentCode);

    const results = [];
    for (let idx = 0; idx < testCases.length; idx++) {
      const tc = testCases[idx];
      let passed = false;
      let actual = '';

      try {
        // Construct verification code
        const testScript = `${currentCode}\n\n# Test verification\nprint(${tc.input || ''})`;

        // Try backend real Python runner
        let testOut = null;
        try {
          const resp = await api.post('/api/student-portal/run-code', { code: testScript, language: 'python' });
          if (resp && resp.output) testOut = resp.output;
        } catch {
          // fallback to client engine
        }

        if (testOut === null) {
          const clientRes = executePython(testScript);
          testOut = clientRes.output;
        }

        const lines = testOut.split('\n').filter((l) => l.trim() && !l.startsWith('[Python') && !l.startsWith('[Program'));
        const lastLine = lines.length > 0 ? lines[lines.length - 1].trim() : '';

        const expStr = String(tc.expected).trim();
        if (
          lastLine === expStr ||
          testOut.includes(expStr) ||
          (expStr === 'True' && lastLine.toLowerCase() === 'true') ||
          (expStr === 'False' && lastLine.toLowerCase() === 'false')
        ) {
          passed = true;
          actual = expStr;
        } else {
          passed = false;
          actual = lastLine || testOut || 'Belum menghasilkan nilai yang sesuai';
        }
      } catch (e) {
        passed = false;
        actual = `Error pengujian: ${e.message}`;
      }

      results.push({
        id: idx + 1,
        input: tc.input || `Test Case #${idx + 1}`,
        expected: String(tc.expected),
        actual: passed ? String(tc.expected) : actual,
        description: tc.description || `Uji validasi kriteria #${idx + 1}`,
        passed,
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  // Save Project to Backend
  const handleSaveProject = async () => {
    setSaveStatus('Menyimpan project...');
    try {
      const payload = {
        materialId,
        title: title || 'Praktik Mandiri Siswa',
        language: isWeb ? 'html' : isTurtle ? 'turtle' : 'python',
        code,
        codeOutput: output,
      };

      await api.post('/api/student-portal/projects', payload);

      // Also save to local storage
      const localKey = materialId
        ? `project_${materialId}`
        : worksheetId
        ? `ws_draft_${worksheetId}`
        : null;
      if (localKey) localStorage.setItem(localKey, code);

      setSaveStatus('✓ Project berhasil disimpan!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      // If server error, save locally
      const localKey = materialId
        ? `project_${materialId}`
        : worksheetId
        ? `ws_draft_${worksheetId}`
        : null;
      if (localKey) localStorage.setItem(localKey, code);
      setSaveStatus('✓ Project disimpan di peramban (Lokal)');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Kembalikan kode ke template awal dari guru?')) {
      setCode(starterCode);
      if (editorRef.current) {
        editorRef.current.setValue(starterCode);
      }
      setOutput('');
      setTestResults([]);
    }
  };

  const lineCount = code.split('\n').length;

  return (
    <div
      className={`rounded-2xl overflow-hidden border shadow-xl flex flex-col transition-all ${
        isFullscreen
          ? isDarkTheme ? 'fixed inset-4 z-50 bg-slate-900 border-indigo-500' : 'fixed inset-4 z-50 bg-white border-indigo-500 shadow-2xl'
          : isDarkTheme ? 'bg-slate-900 border-slate-700/80' : 'bg-white border-slate-200 shadow-md'
      }`}
    >
      {/* Top Header Bar */}
      <div className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 transition-colors ${
        isDarkTheme ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100/90 border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-xs font-bold">
            <Code2 className="w-3.5 h-3.5" />
            <span>{isWeb ? 'HTML/CSS/JS' : isTurtle ? 'Python Turtle' : 'Python 3'}</span>
          </div>
          <span className={`text-xs font-bold truncate max-w-xs sm:max-w-md ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
            {title}
          </span>
          {saveStatus && (
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md animate-fade-in">
              {saveStatus}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleEditorTheme}
            className={`p-1.5 rounded-lg transition ${
              isDarkTheme
                ? 'text-amber-400 hover:text-amber-300 hover:bg-slate-800'
                : 'text-amber-600 hover:text-amber-700 hover:bg-slate-200'
            }`}
            title={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={handleCopy}
            className={`p-1.5 rounded-lg transition ${
              isDarkTheme
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Copy Code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleReset}
            className={`p-1.5 rounded-lg transition ${
              isDarkTheme
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Reset to Starter Code"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1.5 rounded-lg transition ${
              isDarkTheme
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleSaveProject}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              isDarkTheme
                ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
            }`}
          >
            <Save className="w-3.5 h-3.5 text-indigo-400" />
            <span>Save Project</span>
          </button>

          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-4 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>

          {isTestMode && onSubmit && (
            <button
              onClick={() => onSubmit({ code, output })}
              className="px-4 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Answer</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split Grid (Editor on Left, Output/Preview on Right) */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x flex-1 min-h-[420px] lg:min-h-[480px] transition-colors ${
        isDarkTheme ? 'divide-slate-800' : 'divide-slate-200'
      }`}>
        {/* Left Side: VS Code Monaco Editor Area */}
        <div className={`flex flex-col relative transition-colors ${isDarkTheme ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
          {/* VS Code Tab Bar */}
          <div className={`flex items-center justify-between border-b text-[11px] font-mono select-none overflow-x-auto transition-colors ${
            isDarkTheme ? 'bg-[#252526] border-[#1e1e1e]' : 'bg-slate-100 border-slate-200'
          }`}>
            <div className="flex items-center">
              <div className={`flex items-center gap-2 px-3.5 py-1.5 border-t-2 border-indigo-500 border-r text-[11px] font-mono transition-colors ${
                isDarkTheme ? 'bg-[#1e1e1e] text-slate-200 border-r-[#2d2d2d]' : 'bg-white text-slate-800 border-r-slate-200'
              }`}>
                {isWeb ? (
                  <span className="text-orange-400 font-bold">&lt;/&gt;</span>
                ) : isTurtle ? (
                  <span className="text-emerald-400">🐢</span>
                ) : (
                  <span className="text-blue-400 font-bold">Py</span>
                )}
                <span className={`font-medium text-xs ${isDarkTheme ? 'text-slate-200' : 'text-slate-800'}`}>
                  {isWeb ? 'index.html' : isTurtle ? 'turtle_pattern.py' : 'main.py'}
                </span>
                <span className="text-slate-500 hover:text-slate-300 ml-1 cursor-pointer">×</span>
              </div>
            </div>

            {/* Breadcrumb Path */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 text-[11px] ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="text-indigo-400 font-bold">SPINS</span>
              <span>›</span>
              <span>workspace</span>
              <span>›</span>
              <span className={`font-medium ${isDarkTheme ? 'text-slate-200' : 'text-slate-700'}`}>{isWeb ? 'index.html' : 'main.py'}</span>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div
            className={`relative overflow-hidden transition-colors ${isDarkTheme ? 'bg-[#1e1e1e]' : 'bg-white'}`}
            style={{ height: isFullscreen ? 'calc(100vh - 160px)' : '480px' }}
          >
            <Editor
              height="100%"
              language={isWeb ? 'html' : 'python'}
              theme={editorTheme}
              value={code}
              onChange={(val) => setCode(val || '')}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace",
                fontLigatures: true,
                minimap: { enabled: true, maxColumn: 45 },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                bracketPairColorization: { enabled: true },
                padding: { top: 10, bottom: 10 },
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                formatOnPaste: true,
              }}
              loading={
                <div className={`flex flex-col items-center justify-center h-full text-xs gap-2 py-12 ${
                  isDarkTheme ? 'bg-[#1e1e1e] text-slate-400' : 'bg-white text-slate-500'
                }`}>
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="font-mono">Menyiapkan Monaco VS Code Editor...</span>
                </div>
              }
            />
          </div>

          {/* VS Code Bottom Status Bar */}
          <div className="flex items-center justify-between px-3 py-1 bg-[#007acc] text-white text-[11px] font-mono select-none">
            {/* Left Status items */}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 hover:bg-white/10 px-1 rounded transition">
                <GitBranch className="w-3 h-3" /> main*
              </span>
              <span className="flex items-center gap-1 hover:bg-white/10 px-1 rounded transition text-[10px]">
                <span>0 ⨂</span>
                <span>0 ⚠</span>
              </span>
            </div>

            {/* Right Status items */}
            <div className="flex items-center gap-3">
              <span
                onClick={toggleEditorTheme}
                className="flex items-center gap-1 hover:bg-white/20 px-1.5 py-0.5 rounded cursor-pointer transition select-none"
                title={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkTheme ? <Sun className="w-3 h-3 text-amber-300" /> : <Moon className="w-3 h-3 text-sky-200" />}
                <span>{isDarkTheme ? 'Dark Mode' : 'Light Mode'}</span>
              </span>
              <span className="hover:bg-white/10 px-1 rounded transition">
                Ln {cursorPos.line}, Col {cursorPos.col}
              </span>
              <span className="hidden sm:inline hover:bg-white/10 px-1 rounded transition">
                Spaces: 4
              </span>
              <span className="hidden sm:inline hover:bg-white/10 px-1 rounded transition">
                UTF-8
              </span>
              <span className="hover:bg-white/10 px-1 rounded transition">
                {isWeb ? 'HTML' : isTurtle ? 'Python (Turtle)' : 'Python 3'}
              </span>
              <span className="hidden md:inline hover:bg-white/10 px-1 rounded transition">
                Prettier ✓
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Output / Turtle / Preview / Tests Area */}
        <div className={`flex flex-col transition-colors ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
          {/* Output Mode Tab Bar */}
          <div className={`flex items-center gap-1 px-3 py-1.5 border-b text-xs transition-colors ${
            isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveTab('console')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'console'
                  ? isDarkTheme ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                  : isDarkTheme ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Terminal Output</span>
            </button>

            {isTurtle && (
              <button
                onClick={() => setActiveTab('turtle')}
                className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'turtle'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🐢 Turtle Canvas</span>
              </button>
            )}

            {isWeb && (
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'preview'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Live Web Preview</span>
              </button>
            )}

            {hasTests && (
              <button
                onClick={() => {
                  setActiveTab('tests');
                  if (testResults.length === 0) handleRunTests();
                }}
                className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'tests'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Run Test Cases ({testCases.length})</span>
              </button>
            )}

            {teacherNotes && (
              <button
                onClick={() => setActiveTab('notes')}
                className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'notes'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Teacher Guidance</span>
              </button>
            )}
          </div>

          {/* Tab Content Display */}
          <div
            className={`flex-1 p-3 overflow-y-auto transition-colors ${
              isDarkTheme ? 'bg-[#181818] text-slate-200' : 'bg-white text-slate-800'
            }`}
            style={{ height: isFullscreen ? 'calc(100vh - 160px)' : '480px' }}
          >
            {activeTab === 'console' && (
              <div className="font-mono text-xs leading-5 space-y-2">
                <div className={`text-[11px] pb-1.5 border-b flex items-center justify-between ${
                  isDarkTheme ? 'text-slate-500 border-[#2a2a2a]' : 'text-slate-400 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>TERMINAL</span>
                    <span className={isDarkTheme ? 'text-slate-500' : 'text-slate-400'}>|</span>
                    <span className={isDarkTheme ? 'text-slate-400' : 'text-slate-500'}>1: python (spins-venv)</span>
                  </div>
                  <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online Sandbox
                  </span>
                </div>
                {output ? (
                  <pre className={`whitespace-pre-wrap font-mono ${
                    isDarkTheme ? 'text-slate-200 selection:bg-indigo-500/30' : 'text-slate-900 selection:bg-indigo-100'
                  }`}>{output}</pre>
                ) : (
                  <div className="italic py-3 space-y-1">
                    <p className="text-emerald-500 font-mono">PS C:\SPINS\LMS&gt; python main.py</p>
                    <p className={`font-sans text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
                      Click the <strong>"Run Code"</strong> button at the top right to execute your code and view output.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'turtle' && (
              <TurtleCanvas commands={turtleCommands} />
            )}

            {activeTab === 'preview' && (
              <div className={`h-full min-h-[340px] rounded-xl overflow-hidden border ${
                isDarkTheme ? 'bg-white border-slate-700' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <iframe
                  title="Web Preview Sandbox"
                  srcDoc={code}
                  sandbox="allow-scripts"
                  className="w-full h-full min-h-[340px] border-none"
                />
              </div>
            )}

            {activeTab === 'tests' && (
              <div className="space-y-3">
                <div className={`flex items-center justify-between pb-2 border-b ${
                  isDarkTheme ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <span className={`text-xs font-bold ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    Automated Test Results
                  </span>
                  <button
                    onClick={handleRunTests}
                    className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Rerun Tests
                  </button>
                </div>

                {testResults.length === 0 ? (
                  <p className={`text-xs italic ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                    Click "Rerun Tests" to check if your code satisfies all evaluation criteria.
                  </p>
                ) : (
                  testResults.map((tr) => (
                    <div
                      key={tr.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        tr.passed
                          ? isDarkTheme ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : isDarkTheme ? 'border-rose-500/30 bg-rose-500/10' : 'border-rose-200 bg-rose-50 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold flex items-center gap-1.5 ${
                          isDarkTheme ? 'text-white' : 'text-slate-900'
                        }`}>
                          {tr.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500" />
                          )}
                          Test #{tr.id}: {tr.description}
                        </span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            tr.passed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                          }`}
                        >
                          {tr.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      <div className={`font-mono text-[11px] pt-1 ${
                        isDarkTheme ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        <p>Input: <span className={isDarkTheme ? 'text-slate-200' : 'text-slate-900'}>{tr.input}</span></p>
                        <p>Expected: <span className={isDarkTheme ? 'text-emerald-300' : 'text-emerald-700 font-semibold'}>{tr.expected}</span></p>
                        {!tr.passed && (
                          <p>Actual Output: <span className={isDarkTheme ? 'text-rose-300' : 'text-rose-700 font-semibold'}>{tr.actual}</span></p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${
                isDarkTheme ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <h4 className="font-bold flex items-center gap-1.5 text-amber-500 text-sm">
                  <Sparkles className="w-4 h-4" /> Teacher Guidance & Notes
                </h4>
                <p className={`whitespace-pre-line ${isDarkTheme ? 'text-slate-200' : 'text-slate-700'}`}>
                  {teacherNotes || 'Follow the step-by-step instructions and try experimenting with variable values to see different outputs.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
