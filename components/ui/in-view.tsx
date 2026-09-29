'use client';
import { ReactNode, useRef, CSSProperties } from 'react';
import { motion, useInView } from 'motion/react';
import type { Variant, Transition } from 'motion/react';

type ViewOptions = Parameters<typeof useInView>[1];

interface InViewProps {
  children: ReactNode;
  variants?: {
    hidden: Variant;
    visible: Variant;
  };
  transition?: Transition;
  viewOptions?: ViewOptions;
  className?: string;
  style?: CSSProperties;
}

const defaultVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export function InView({
  children,
  variants = defaultVariants,
  transition,
  viewOptions,
  className,
  style,
}: InViewProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, viewOptions);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      transition={transition}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
