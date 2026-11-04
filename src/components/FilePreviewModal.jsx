import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  FileText,
  Code,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';

export default function FilePreviewModal({ isOpen, onClose, file }) {
  const [copied, setCopied] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [loadingText, setLoadingText] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!file || !isOpen) {
      setTextContent('');
      setZoomLevel(1);
      return;
    }

    const ext = getFileExtension(file.fileName || file.fileUrl);
    const isTextOrCode = ['txt', 'md', 'py', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'sql', 'c', 'cpp', 'java'].includes(ext);

    if (isTextOrCode && file.fileUrl) {
      setLoadingText(true);
      fetch(file.fileUrl)
        .then(res => res.text())
        .then(text => setTextContent(text))
        .catch(() => setTextContent('Failed to load text file content.'))
        .finally(() => setLoadingText(false));
    }
  }, [file, isOpen]);

  if (!isOpen || !file) return null;

  const fileName = file.fileName || 'Attached File';
  const fileUrl = file.fileUrl || '';
  const ext = getFileExtension(fileName || fileUrl);

  const isPdf = ext === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext);
  const isCodeOrText = ['txt', 'md', 'py', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'sql', 'c', 'cpp', 'java'].includes(ext);

  const handleCopy = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col z-10 overflow-hidden"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/50 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                {isImage ? (
                  <ImageIcon className="w-5 h-5" />
                ) : isCodeOrText ? (
                  <Code className="w-5 h-5" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                  {fileName}
                </h3>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="uppercase font-semibold">{ext}</span>
                  {file.fileSize && (
                    <>
                      <span>·</span>
                      <span>{formatSize(file.fileSize)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {isCodeOrText && textContent && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  title="Copy Content"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}

              {isImage && (
                <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5">
                  <button
                    onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-500 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono px-1 text-zinc-600 dark:text-zinc-300">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(z => Math.min(2.5, z + 0.25))}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-500 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {fileUrl && (
                <a
                  href={fileUrl}
                  download={fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm cursor-pointer"
                  title="Download Original File"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 bg-zinc-100/60 dark:bg-zinc-950 flex items-center justify-center min-h-[350px]">
            {/* 1. PDF Preview */}
            {isPdf && (
              <div className="w-full h-[65vh] rounded-xl overflow-hidden shadow-inner border border-zinc-200 dark:border-zinc-800 bg-white">
                <iframe
                  src={`${fileUrl}#toolbar=1&navpanes=0`}
                  title={fileName}
                  className="w-full h-full border-none"
                />
              </div>
            )}

            {/* 2. Image Preview */}
            {isImage && (
              <div className="max-w-full max-h-[65vh] overflow-auto flex items-center justify-center p-4">
                <img
                  src={fileUrl}
                  alt={fileName}
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-md transition-transform duration-200"
                />
              </div>
            )}

            {/* 3. Text / Code Preview */}
            {isCodeOrText && (
              <div className="w-full h-[65vh] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex flex-col font-mono text-xs">
                <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-zinc-400 text-[11px]">
                  <span>{fileName}</span>
                  <span>{textContent ? `${textContent.split('\n').length} lines` : ''}</span>
                </div>
                <div className="flex-1 overflow-auto p-4 text-zinc-200 leading-relaxed select-text whitespace-pre">
                  {loadingText ? (
                    <div className="flex items-center justify-center h-full text-zinc-500">
                      Loading file content...
                    </div>
                  ) : (
                    textContent || 'Empty file.'
                  )}
                </div>
              </div>
            )}

            {/* 4. Fallback for other document types */}
            {!isPdf && !isImage && !isCodeOrText && (
              <div className="text-center p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-md shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-1">{fileName}</h4>
                <p className="text-xs text-zinc-500 mb-5">
                  The file format ({ext.toUpperCase()}) does not support inline preview in the browser. Please download it to view.
                </p>
                <a
                  href={fileUrl}
                  download={fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Document Now</span>
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function getFileExtension(filename = '') {
  if (!filename) return '';
  const clean = filename.split('?')[0];
  const parts = clean.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}
