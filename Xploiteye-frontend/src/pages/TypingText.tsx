import { useState, useEffect, memo } from "react";

interface TypingTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  speed?: number;
}

export const TypingText = memo<TypingTextProps>(({ text, className, style, speed = 50 }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed, isClient]);

  // During SSR, render a placeholder to prevent hydration mismatch
  if (!isClient) {
    return (
      <span className={className} style={style}>
        <span style={{ opacity: 0 }}>{text}</span>
      </span>
    );
  }

  return (
    <span className={className} style={style}>
      {displayText}
      {currentIndex < text.length && <span className="animate-pulse">|</span>}
    </span>
  );
});

TypingText.displayName = 'TypingText';

export default TypingText;