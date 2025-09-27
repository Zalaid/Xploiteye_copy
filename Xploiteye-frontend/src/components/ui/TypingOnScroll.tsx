
import { useState, useEffect, useRef } from "react";
import { TypingText } from "../../pages/TypingText";

interface TypingOnScrollProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  speed?: number;
}

export const TypingOnScroll = ({ text, className, style, speed }: TypingOnScrollProps) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <span ref={ref} className={className} style={style}>
      {isInView ? <TypingText text={text} speed={speed} /> : <span style={{ opacity: 0 }}>{text}</span>}
    </span>
  );
};
