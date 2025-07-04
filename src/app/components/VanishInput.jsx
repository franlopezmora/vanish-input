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
      e.preventDefault()
      const chars = value.split('').map((char, i) => ({
        id: `${char}-${i}-${Date.now()}`,
        char,
        index: i,
      }))
      setLetters(chars)
      onSubmit(value.trim())
      setValue("")
      setVanishing(true)

      setTimeout(() => {
        setVanishing(false)
        setLetters([])
      }, 1000)
    }
  }

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
        {value}
      </span>

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
          suppressContentEditableWarning
          onInput={(e) => setValue(e.currentTarget.textContent)}
          onKeyDown={handleKeyDown}
          className={`bg-transparent outline-none pl-4 w-full whitespace-nowrap overflow-hidden transition-all duration-300 ${vanishing ? 'text-transparent caret-white' : 'text-white'}`}
          style={{
            fontFamily: 'inherit',
            fontSize: '1rem',
          }}
        />

        {vanishing && (
          <div className="absolute left-[38px] top-1/2 -translate-y-1/2 flex pointer-events-none">
            <AnimatePresence>
              {letters.map((item, i) => (
                <motion.span key={item.id} className="relative inline-block w-4 h-6">
                  {[...Array(5)].map((_, j) => (
                    <motion.div
                      key={j}
                      initial={{ x: 0, y: 0, opacity: 0.8, scale: 1 }}
                      animate={{
                        x: -10 - Math.random() * 10,
                        y: (Math.random() - 0.5) * 6,
                        opacity: 0,
                        scale: 1 + Math.random() * 0.5,
                      }}
                      transition={{
                        duration: 0.8,
                        delay: i * 0.015 + j * 0.02,
                        ease: 'easeOut',
                      }}
                      className="absolute w-[2px] h-[2px] rounded-full bg-white blur-[1px]"
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
