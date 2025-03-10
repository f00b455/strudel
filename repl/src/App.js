import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import CodeMirror, { markEvent, markParens } from './CodeMirror';
import cx from './cx';
import logo from './logo.svg';
import playStatic from './static.mjs';
import { getDefaultSynth } from '@strudel.cycles/tone';
import * as tunes from './tunes.mjs';
import useRepl from './useRepl.mjs';
import { useWebMidi } from './useWebMidi';
import './App.css';
// eval stuff start
import { evaluate, extend } from '@strudel.cycles/eval';
import * as strudel from '@strudel.cycles/core';
import gist from '@strudel.cycles/core/gist.js';
import { mini } from '@strudel.cycles/mini/mini.mjs';
import { Tone } from '@strudel.cycles/tone';
import * as toneHelpers from '@strudel.cycles/tone/tone.mjs';
import * as voicingHelpers from '@strudel.cycles/tonal/voicings.mjs';
import * as uiHelpers from '@strudel.cycles/tone/ui.mjs';
import * as drawHelpers from '@strudel.cycles/tone/draw.mjs';
import euclid from '@strudel.cycles/core/euclid.mjs';
import '@strudel.cycles/tone/tone.mjs';
import '@strudel.cycles/midi/midi.mjs';
import '@strudel.cycles/tonal/voicings.mjs';
import '@strudel.cycles/tonal/tonal.mjs';
import '@strudel.cycles/xen/xen.mjs';
import '@strudel.cycles/xen/tune.mjs';
import '@strudel.cycles/core/euclid.mjs';
import '@strudel.cycles/core/speak.mjs';
import '@strudel.cycles/tone/pianoroll.mjs';
import '@strudel.cycles/tone/draw.mjs';
import '@strudel.cycles/osc/osc.mjs';
import controls from '@strudel.cycles/core/controls.mjs';

extend(
  Tone,
  strudel,
  strudel.Pattern.prototype.bootstrap(),
  controls,
  toneHelpers,
  voicingHelpers,
  drawHelpers,
  uiHelpers,
  {
    gist,
    euclid,
    mini,
    Tone,
  },
);
// eval stuff end

const codeParam = window.location.href.split('#')[1];
let decoded;
try {
  decoded = atob(decodeURIComponent(codeParam || ''));
} catch (err) {
  console.warn('failed to decode', err);
}

function getRandomTune() {
  const allTunes = Object.values(tunes);
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  return randomItem(allTunes);
}

const randomTune = getRandomTune();
const defaultSynth = getDefaultSynth();

function App() {
  const [editor, setEditor] = useState();
  const { setCode, setPattern, error, code, cycle, dirty, log, togglePlay, activateCode, pattern, pushLog, pending } =
    useRepl({
      tune: decoded || randomTune,
      defaultSynth,
      onDraw: useCallback((time, event) => markEvent(editor)(time, event), [editor]),
    });
  const [uiHidden, setUiHidden] = useState(false);
  const logBox = useRef();
  // scroll log box to bottom when log changes
  useLayoutEffect(() => {
    logBox.current.scrollTop = logBox.current?.scrollHeight;
  }, [log]);

  // set active pattern on ctrl+enter
  useLayoutEffect(() => {
    // TODO: make sure this is only fired when editor has focus
    const handleKeyPress = async (e) => {
      if (e.ctrlKey || e.altKey) {
        if (e.code === 'Enter') {
          await activateCode();
          e.preventDefault();
        } else if (e.code === 'Period') {
          cycle.stop();
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pattern, code, activateCode, cycle]);

  useWebMidi({
    ready: useCallback(
      ({ outputs }) => {
        pushLog(`WebMidi ready! Just add .midi(${outputs.map((o) => `'${o.name}'`).join(' | ')}) to the pattern. `);
      },
      [pushLog],
    ),
    connected: useCallback(
      ({ outputs }) => {
        pushLog(`Midi device connected! Available: ${outputs.map((o) => `'${o.name}'`).join(', ')}`);
      },
      [pushLog],
    ),
    disconnected: useCallback(
      ({ outputs }) => {
        pushLog(`Midi device disconnected! Available: ${outputs.map((o) => `'${o.name}'`).join(', ')}`);
      },
      [pushLog],
    ),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <header
        id="header"
        className={cx(
          'flex-none w-full h-14 px-2 flex border-b border-gray-200  justify-between z-[10]',
          uiHidden ? 'bg-transparent text-white' : 'bg-white',
        )}
      >
        <div className="flex items-center space-x-2">
          <img src={logo} className="Tidal-logo w-12 h-12" alt="logo" />
          <h1 className="text-2xl">Strudel REPL</h1>
        </div>
        <div className="flex space-x-4">
          <button onClick={() => togglePlay()}>
            {!pending ? (
              <span className="flex items-center w-16">
                {cycle.started ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {cycle.started ? 'pause' : 'play'}
              </span>
            ) : (
              <>loading...</>
            )}
          </button>
          <button
            onClick={async () => {
              const _code = getRandomTune();
              console.log('tune', _code); // uncomment this to debug when random code fails
              setCode(_code);
              drawHelpers.cleanup();
              uiHelpers.cleanup();
              const parsed = await evaluate(_code);
              setPattern(parsed.pattern);
            }}
          >
            🎲 random
          </button>
          <button>
            <a href="./tutorial">📚 tutorial</a>
          </button>
          <button onClick={() => setUiHidden((c) => !c)}>👀 {uiHidden ? 'show ui' : 'hide ui'}</button>
        </div>
      </header>
      <section className="grow flex flex-col text-gray-100">
        <div className="grow relative" id="code">
          <div
            className={cx(
              'h-full transition-opacity',
              error ? 'focus:ring-red-500' : 'focus:ring-slate-800',
              uiHidden ? 'opacity-0' : 'opacity-100',
            )}
          >
            <CodeMirror
              value={code}
              editorDidMount={setEditor}
              options={{
                mode: 'javascript',
                theme: 'material',
                lineNumbers: false,
                styleSelectedText: true,
                cursorBlinkRate: 0,
              }}
              onCursor={markParens}
              onChange={(_, __, value) => setCode(value)}
            />
            <span className="p-4 absolute top-0 right-0 text-xs whitespace-pre text-right pointer-events-none">
              {!cycle.started ? `press ctrl+enter to play\n` : dirty ? `ctrl+enter to update\n` : 'no changes\n'}
            </span>
          </div>
          {error && (
            <div className={cx('absolute right-2 bottom-2 px-2', 'text-red-500')}>
              {error?.message || 'unknown error'}
            </div>
          )}
        </div>
        <textarea
          className="z-[10] h-16 border-0 text-xs bg-[transparent] border-t border-slate-600 resize-none"
          value={log}
          readOnly
          ref={logBox}
          style={{ fontFamily: 'monospace' }}
        />
      </section>
      <button className="fixed right-4 bottom-2 z-[11]" onClick={() => playStatic(code)}>
        static
      </button>
    </div>
  );
}

export default App;
