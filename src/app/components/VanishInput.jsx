'use client';
import { useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VanishInput({
  placeholder = 'What do you need?',
  icon = '🔍',
  minWidth = 100,
  onSubmit = () => {},
}) {
  const [value, setValue] = useState('');
  const [vanishing, setVanishing] = useState(false);
  const [letters, setLetters] = useState([]);
  const [inputWidth, setInputWidth] = useState(minWidth);
  const [hasFocus, setHasFocus] = useState(false);
  const [caretOffset, setCaretOffset] = useState(0);
  const [showFakeCaret, setShowFakeCaret] = useState(false);
  const [fakeCaretDuration, setFakeCaretDuration] = useState(0.6);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const measureRef = useRef(null);
  const placeholderRef = useRef(null);
  const iconSize = 24;
  const padding = 24;
  const baseLeft = iconSize + padding;

  const updateCaretOffset = () => {
    if (typeof window === 'undefined') return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !containerRef.current) return;

    const range = selection.getRangeAt(0);
    const rect = range.getClientRects()[0];
    if (rect) {
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      setCaretOffset(rect.left - containerLeft - 49);
    }
  };

useLayoutEffect(() => {
  updateCaretOffset();
}, [value, hasFocus]);

  useLayoutEffect(() => {
    const baseEl = value ? measureRef.current : placeholderRef.current;
    const measured = baseEl?.offsetWidth || 0;
    const iconWidth = 24;
    const paddingX = 16 + 16;
    const buffer = 4;
    setInputWidth(Math.max(minWidth, measured + iconWidth + paddingX + buffer));
  }, [value, placeholder, minWidth]);

  const handleKeyDown = (e) => {
    const editable = inputRef.current;
    const textNode = editable.firstChild;

    // Ctrl + ←
    if (e.key === 'ArrowLeft' && e.ctrlKey) {
      e.preventDefault();
      if (textNode) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      return;
    }

    // Ctrl + →
    if (e.key === 'ArrowRight' && e.ctrlKey) {
      e.preventDefault();
      if (textNode) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.setStart(textNode, textNode.length);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      return;
    }

    // Ctrl + Backspace
    if (e.key === 'Backspace' && e.ctrlKey) {
      e.preventDefault();
      if (textNode) {
        const selection = window.getSelection();
        const cursorPos = selection.focusOffset;
        const currentText = textNode.textContent;
        const leftText = currentText.slice(0, cursorPos);
        const rightText = currentText.slice(cursorPos);
        const newLeft = leftText.replace(/\s*\S+$/, '');
        const newText = newLeft + rightText;
        textNode.textContent = newText;
        setValue(newText.trim());

        const range = document.createRange();
        range.setStart(textNode, newLeft.length);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      return;
    }

    // Enter
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      const trimmed = value.trim();
      const chars = trimmed.split('').map((char, i) => ({
        id: `${char}-${i}-${Math.random().toString(36).substring(2, 9)}`,
        char,
        offset: 12 * i, // animación aproximada (ya no usás offset real)
        top: 0
      }));

      const shouldAnimateCaret = caretOffset !== 0;

      if (shouldAnimateCaret) setShowFakeCaret(true);
      setVanishing(true);

      if (inputRef.current) {
        inputRef.current.textContent = '';
        inputRef.current.focus();
      }

      setLetters(chars);
      onSubmit(trimmed);

      const maxDelay = (chars.length - 1) * 0.03 + 0.04 + 40 * 0.003 + 0.05;
      setFakeCaretDuration(maxDelay * 1000);

setTimeout(() => {
  setValue('');
  setLetters([]);
  setShowFakeCaret(false);

  // Esperar a que `vanishing` se apague visualmente
  requestAnimationFrame(() => {
    setVanishing(false);

    requestAnimationFrame(() => {
      if (inputRef.current) {
        // aseguramos que tenga un nodo de texto
        if (!inputRef.current.childNodes.length) {
          inputRef.current.appendChild(document.createTextNode(''));
        }

        inputRef.current.focus();

        const selection = window.getSelection();
        const range = document.createRange();
        range.setStart(inputRef.current.firstChild, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);

        updateCaretOffset();
      }
    });
  });
}, maxDelay * 1000 - 2);

    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] relative font-sans">
      {/* invisible measurement spans */}
      <span ref={measureRef} className="invisible absolute whitespace-pre text-base" style={{ fontFamily: 'inherit' }}>{value || '\u200B'}</span>
      <span ref={placeholderRef} className="invisible absolute whitespace-pre text-base">{placeholder}</span>

      {/* input container */}
      <div ref={containerRef} className="relative z-10 bg-black text-white px-3 py-2 rounded-lg border border-neutral-800 shadow-lg overflow-hidden flex items-center" style={{ width: `${inputWidth}px`, transition: 'width 0.3s ease-in-out' }}>
        <span className="text-neutral-500 w-4 shrink-0">{icon}</span>
        <AnimatePresence>
          {value === "" && !vanishing && (
            <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute left-[48px] text-neutral-500" style={{ left: `${baseLeft - 4}px` }}>{placeholder}</motion.div>
          )}
        </AnimatePresence>

        <div className="relative pl-4 w-full whitespace-nowrap overflow-hidden z-10">
          {!vanishing ? (
            <div
              ref={inputRef}
              contentEditable
              className="bg-transparent outline-none text-white caret-transparent"
              onFocus={() => {
                setHasFocus(true);
                updateCaretOffset();
              }}
              onBlur={() => setHasFocus(false)}
              suppressContentEditableWarning
              onInput={(e) => {
                const raw = e.currentTarget.textContent;
                const cleaned = raw.replace(/\n/g, '');
                setValue(cleaned);
                updateCaretOffset();
              }}
              onKeyDown={(e) => {
                handleKeyDown(e);
                setTimeout(updateCaretOffset, 0); // luego del movimiento
              }}
              onClick={(e) => {
                if (!value.trim()) {
                  e.preventDefault();
                  const selection = window.getSelection();
                  const range = document.createRange();
                  const node = inputRef.current.firstChild;
                  if (node) {
                    range.setStart(node, 0);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    requestAnimationFrame(() => updateCaretOffset());
                  }
                } else {
                  requestAnimationFrame(() => updateCaretOffset());
                }
              }}


            />
          ) : (
            <div className="flex">
              <AnimatePresence mode="popLayout">
                {letters.map((item, i) => (
                  <motion.span
                    key={item.id}
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: 0, scale: 0.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: (letters.length - i - 1) * 0.03 }}
                    className="relative inline-block"
                  >
                    {item.char}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Caret personalizado visible cuando hay focus */}
        {hasFocus && !vanishing && (
          <div
            className="absolute bg-white w-[2px] h-[1.25rem] animate-pulse"
            style={{
              left: `${(value ? caretOffset : -4) + baseLeft}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 50,
            }}
          />
        )}
      </div>

      {showFakeCaret && (
        <motion.div
          key="fake-caret"
          initial={{ x: caretOffset, y: -31, opacity: 1 }}
          animate={{ x: -5, y: -31, opacity: 1 }}
          transition={{ duration: fakeCaretDuration / 1000, ease: "easeInOut" }}

          className="absolute custom-caret"
          style={{
            left: `${baseLeft}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 9999, // por encima de todo
          }}
        />
      )}



      {/* Partículas */}
      {vanishing && (
        <div className="absolute left-[32px] flex items-center pointer-events-none whitespace-pre pl-2" style={{ top: '44%', transform: 'translateY(-50%)', height: '2rem', zIndex: 50 }}>
          <AnimatePresence>
            {letters.map((item, i) => (
              <motion.span key={item.id} className="absolute" style={{ left: `${item.offset + baseLeft}px`, top: `${item.top}px` }}>
                {[...Array(40)].map((_, j) => (
                  <motion.div
                    key={j}
                    initial={{ x: 0, y: 15, opacity: 1, scale: 1 }}
                    animate={{
                      x: -item.offset * 0.5 - Math.random() * 30 - 60,
                      y: 15 + (Math.random() - 0.5) * 40,
                      opacity: 0,
                      scale: 0.6
                    }}
                    transition={{ duration: 0.8, delay: (letters.length - i) * 0.025 + j * 0.003, ease: 'easeOut' }}
                    className="absolute rounded-full bg-white"
                    style={{ width: '1px', height: '1px' }}
                  />
                ))}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      )}

      <p className="mt-4 text-neutral-500 text-sm z-10">Type and press Enter</p>
    </div>
  );
}
