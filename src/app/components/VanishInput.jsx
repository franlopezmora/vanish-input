'use client'
import { useState, useRef, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function VanishInput({
  placeholder = "What do you need?",
  icon = "🔍",
  minWidth = 100, // <- ✅ nuevo
  onSubmit = () => {}
}) {
  const [value, setValue] = useState("")
  const [vanishing, setVanishing] = useState(false)
  const [letters, setLetters] = useState([])
  const [inputWidth, setInputWidth] = useState(minWidth)

  const inputRef = useRef(null)
  const measureRef = useRef(null)
  const placeholderRef = useRef(null)
  const spansRef = useRef([]);
  const iconSize = 24;
  const padding = 24;
  const baseLeft = iconSize + padding;
  const [hasFocus, setHasFocus] = useState(false);
  const [caretOffset, setCaretOffset] = useState(0);
  const [showFakeCaret, setShowFakeCaret] = useState(false)

  useLayoutEffect(() => {
    const last = spansRef.current[value.length - 1];
    if (last) {
        const offset = last.offsetLeft + last.offsetWidth;
        setCaretOffset(offset);
    } else {
        setCaretOffset(0);
    }
  }, [value]);

  useLayoutEffect(() => {
        const baseEl = value ? measureRef.current : placeholderRef.current
        const measured = baseEl?.offsetWidth || 0
        const iconWidth = 24
        const paddingX = 16 + 16
        const buffer = 4
        const totalWidth = Math.max(minWidth, measured + iconWidth + paddingX + buffer)

        setInputWidth(totalWidth)
  }, [value, placeholder, minWidth])


  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value.trim()) {
        e.preventDefault();

        const trimmed = value.trim();
        const chars = trimmed.split('').map((char, i) => {
        const span = spansRef.current[i];
        const offset = span?.offsetLeft || i * 16;
        const top = span?.offsetTop || 0;
        return {
            id: `${char}-${i}-${Date.now()}`,
            char,
            offset,
            top
        };
        });


        // 1. Ocultamos el caret real
        inputRef.current.blur();
        setShowFakeCaret(true);
        setVanishing(true);

        // 2. Disparamos animación
        setLetters(chars);
        onSubmit(trimmed);

        // 3. Limpiamos y restauramos caret luego de la animación
        setTimeout(() => {
        setValue("");
        inputRef.current.textContent = "";

        setLetters([]);
        setVanishing(false);
        setShowFakeCaret(false);

        inputRef.current.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(inputRef.current, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        }, 800); // igual duración que la animación del caret falso
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] relative font-sans">
        {/* Medidor oculto para texto ingresado */}
        <span
            ref={measureRef}
            className="invisible absolute whitespace-pre text-base"
            style={{
            fontFamily: 'inherit',
            fontSize: '1rem',
            lineHeight: '1.5rem',
            padding: 0,
            margin: 0,
            }}
            
        >
            {value || '\u200B'}
        </span>

        <div
            className="absolute opacity-0 pointer-events-none whitespace-pre"
            style={{
                top: 0,
                left: 0,
                fontFamily: 'inherit',
                fontSize: '1rem',
                lineHeight: '1.5rem'
            }}
            ref={el => (spansRef.currentWrapper = el)}
            >

            {value.split('').map((char, i) => (
                <span
                key={i}
                ref={el => spansRef.current[i] = el}
                className="inline-block text-base"
                style={{
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    lineHeight: '1.5rem',
                    margin: 0,
                    padding: 0
                }}
                >
                {char}
                </span>
            ))}
        </div>


        {/* Medidor oculto para placeholder */}
        <span
            ref={placeholderRef}
            className="invisible absolute whitespace-pre text-base"
            style={{
            fontFamily: 'inherit',
            fontSize: '1rem',
            lineHeight: '1.5rem',
            padding: 0,
            margin: 0,
            }}
        >
        {placeholder}
        </span>

        <div
            className="relative z-10 bg-black text-white px-3 py-2 rounded-lg border border-neutral-800 shadow-lg overflow-hidden flex items-center"
            style={{
            width: `${inputWidth}px`,
            transition: 'width 0.3s ease-in-out'
            }}
        >
            <span className="text-neutral-500 w-4 shrink-0">{icon}</span>

            {value === "" && !vanishing && (
            <div
                key={placeholder}
                className="absolute left-[48px] text-neutral-500 text-base select-none pointer-events-none"
            >
                {placeholder}
            </div>
            )}

            <div
            ref={inputRef}
            contentEditable
            onFocus={() => setHasFocus(true)}
            onBlur={() => setHasFocus(false)}

            suppressContentEditableWarning
            onInput={(e) => {
            // Siempre evitamos que haya salto de línea
            const raw = e.currentTarget.innerText;
            const cleaned = raw.replace(/\n/g, '').trim();
            setValue(cleaned);

            // Si está vacío, eliminamos también todos los nodos dentro del contentEditable
            if (cleaned === "") {
                e.currentTarget.innerHTML = ""; // ← ¡Esto borra el \n fantasma!
            }
            }}

            onKeyDown={handleKeyDown}
            className={`relative bg-transparent outline-none pl-4 w-full whitespace-nowrap overflow-hidden transition-all duration-300 z-10 ${(vanishing || showFakeCaret || !hasFocus) ? 'text-transparent caret-transparent' : 'text-white caret-transparent custom-caret'
            }`}
            style={{
                fontFamily: 'inherit',
                fontSize: '1rem',
            }}
            />

            {showFakeCaret && (
            <motion.div
                initial={{ x: caretOffset -1 }}
                animate={{ x: -2 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute top-1/2 -translate-y-1/2 w-[2px] h-[1.25rem] bg-white"
                style={{ left: `${baseLeft}px` }}
            />
            )}

            {vanishing && (
            <div className="absolute left-[32px] top-0 h-6 flex items-center pointer-events-none whitespace-pre pl-2 relative z-0">
                <AnimatePresence>
                {letters.map((item, i) => (
                <motion.span
                key={item.id}
                className="absolute"
                style={{
                    left: `${item.offset + 48}px`, // icon + padding
                    top: `0px`,
                    height: '1.5rem'
                }}
                >
                    {[...Array(20)].map((_, j) => (
                        <motion.div
                        key={j}
                        initial={{ x: -150, y: 20, opacity: 1, scale: 1 }}
                        animate={{
                            x: -200 - Math.random() * 20,
                            y: 20 + (Math.random() - 0.5) * 10,
                            opacity: 0,
                            scale: 1 + Math.random() * 0.5,
                        }}
                        transition={{
                            duration: 1.2,
                            delay: i * 0.01 + j * 0.015,
                            ease: 'easeOut',
                        }}
                        className="absolute w-[2.5px] h-[2.5px] rounded-full bg-white blur-[1px]"

                        />
                    ))}
                    </motion.span>
                ))}
                </AnimatePresence>
            </div>
            )}
        </div>
      <p className="mt-4 text-neutral-500 text-sm z-10">Type and press Enter</p>
    </div>
  )
}
