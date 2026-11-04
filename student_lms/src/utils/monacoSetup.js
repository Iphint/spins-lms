import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';
import editorWorker from 'monaco-editor/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/language/typescript/ts.worker?worker';

if (typeof window !== 'undefined') {
  window.MonacoEnvironment = {
    getWorker(_workerId, label) {
      try {
        if (label === 'json') return new jsonWorker();
        if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker();
        if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker();
        if (label === 'typescript' || label === 'javascript') return new tsWorker();
        return new editorWorker();
      } catch (err) {
        console.warn('Monaco worker failed to load, falling back to dummy worker:', err);
        return new Worker(
          URL.createObjectURL(
            new Blob(
              ['self.onmessage = function () {};'],
              { type: 'application/javascript' }
            )
          )
        );
      }
    },
  };
}

loader.config({ monaco });

export { monaco };
