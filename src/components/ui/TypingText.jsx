import { useEffect, useState } from 'react'

/**
 * Cycles through an array of strings with a typing/deleting animation.
 */
export default function TypingText({
  words,
  typingSpeed = 70,
  deletingSpeed = 40,
  pauseTime = 1800,
  className = '',
}) {
  const [wordIndex, setWordIndex] = useState(0)
  const [text, setText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentWord = words[wordIndex % words.length]
    let timeout

    if (!isDeleting && text.length < currentWord.length) {
      timeout = setTimeout(() => {
        setText(currentWord.slice(0, text.length + 1))
      }, typingSpeed)
    } else if (!isDeleting && text.length === currentWord.length) {
      timeout = setTimeout(() => setIsDeleting(true), pauseTime)
    } else if (isDeleting && text.length > 0) {
      timeout = setTimeout(() => {
        setText(currentWord.slice(0, text.length - 1))
      }, deletingSpeed)
    } else if (isDeleting && text.length === 0) {
      setIsDeleting(false)
      setWordIndex((i) => i + 1)
    }

    return () => clearTimeout(timeout)
  }, [text, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseTime])

  return (
    <span className={className}>
      {text}
      <span className="inline-block w-[2px] h-[1em] bg-accent-cyan ml-1 align-middle animate-pulse-slow" />
    </span>
  )
}
