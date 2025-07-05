'use client'
import { useState, useRef, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function randomColor() {
  const colors = ['#e879f9', '#60a5fa', '#facc15', '#34d399', '#f472b6']; // Rosa, azul, amarillo, verde, rosa fuerte
  return colors[Math.floor(Math.random() * colors.length)];
}


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
  const [fakeCaretDuration, setFakeCaretDuration] = useState(0.6);


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
        const chars = trimmed
        .split('')
        .map((char, i) => {
            if (!char) return null; // evita string vacío

            const span = spansRef.current[i];
            const offset = span?.offsetLeft || i * 16;
            const top = span?.offsetTop || 0;

            return {
            id: `${char}-${i}-${Math.random().toString(36).substring(2, 9)}`, // más único
            char,
            offset,
            top
            };
        })
        .filter(Boolean); // elimina los null
        ;


        // 1. Ocultamos el caret real
        inputRef.current.blur();
        setShowFakeCaret(true);
        setVanishing(true);

        if (inputRef.current) {
        inputRef.current.textContent = "";
        }
        // 2. Disparamos animación
        setLetters(chars);
        onSubmit(trimmed);

        const maxLetterDelay = (chars.length - 1) * 0.03;
        const maxParticleDelay = maxLetterDelay + 0.04 + 40 * 0.003;
        const totalDelay = (maxParticleDelay + 0.05) * 1000; // más rápido
        setFakeCaretDuration(totalDelay);

        setFakeCaretDuration(totalDelay);
        // 3. Limpiamos y restauramos caret luego de la animación
        
        setTimeout(() => {
            setValue("");
            setLetters([]);
            setVanishing(false);
            setShowFakeCaret(false);

            if (inputRef.current) {
                // Insertar nodo de texto vacío si no hay ninguno
                if (inputRef.current.childNodes.length === 0) {
                inputRef.current.appendChild(document.createTextNode(""));
                }

                inputRef.current.focus();

                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(inputRef.current);
                range.collapse(false); // Coloca el caret al final
                selection.removeAllRanges();
                selection.addRange(range);
            }

        }, totalDelay - 2); // igual duración que la animación del caret falso
    }
  };

useLayoutEffect(() => {
}, []);

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
            <AnimatePresence>
            {value === "" && !vanishing && (
                <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 0.4 } }}
                className="absolute left-[48px] text-neutral-500 text-base select-none pointer-events-none"
                >
                {placeholder}
                </motion.div>
            )}
            </AnimatePresence>




<div className="relative pl-4 w-full whitespace-nowrap overflow-hidden z-10">
  {!vanishing ? (
    <div
      ref={inputRef}
      contentEditable
      onFocus={() => setHasFocus(true)}
      onBlur={() => setHasFocus(false)}
      suppressContentEditableWarning
      onInput={(e) => {
        const raw = e.currentTarget.textContent;
        const cleaned = raw.replace(/\n/g, '').trim();
        setValue(cleaned);
        if (cleaned === "") e.currentTarget.innerHTML = "";
      }}
      onKeyDown={handleKeyDown}
      className="bg-transparent outline-none text-white caret-transparent custom-caret"
      style={{
        fontFamily: 'inherit',
        fontSize: '1rem',
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
            transition={{
              duration: 0.3,
              delay: (letters.length - i - 1) * 0.03,
            }}
            className="relative inline-block text-white"
            style={{
              fontFamily: 'inherit',
              fontSize: '1rem',
              lineHeight: '1.5rem',
            }}
          >
            {item.char}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )}
</div>


{showFakeCaret && letters.length > 0 && (
  <motion.div
  initial={{ x: caretOffset }}
  animate={{ x: 0 }}
  transition={{ duration: fakeCaretDuration / 1000, ease: "easeInOut" }}
    className="absolute top-1/2 -translate-y-1/2 w-[2px] h-[1.25rem] bg-white"
    style={{ left: `${baseLeft}px` }}
  />
)}




            {vanishing && (
<div
  className="absolute left-[32px] top-0 flex items-center pointer-events-none whitespace-pre pl-2"
  style={{
    height: '2rem',
    zIndex: 50,
    overflow: 'visible',
    pointerEvents: 'none',
  }}
>

                <AnimatePresence>
{letters.map((item, i) => (
  <motion.span
    key={item.id}
    className="absolute"
    style={{
      left: `${item.offset + baseLeft}px`,
      top: `${item.top}px`,
    }}
  >
    {[...Array(40)].map((_, j) => (
      <motion.div
        key={j}
        initial={{ x: 0, y: 15, opacity: 1, scale: 1 }}
        animate={{
          x: -item.offset * 0.5 - Math.random() * 30 - 60,
          y: 15 + (Math.random() - 0.5) * 40,
          opacity: 0,
          scale: 0.6,
        }}
        transition={{
          duration: 0.8,
          delay: (letters.length - i) * 0.025 + j * 0.003, // ✨ delay en cascada
          ease: 'easeOut',
        }}
        className="absolute rounded-full"
        style={{
          width: `1px`,
          height: `1px`,
          backgroundColor: '#ffffff',
        }}
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
