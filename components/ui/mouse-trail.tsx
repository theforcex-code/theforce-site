'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ImageTrailController } from '@/lib/utils';

// Transparent "flair" confetti — purpose-built for a trail effect (alpha
// PNGs read cleanly as a cursor, unlike opaque photos). Swap `images` via
// props to use brand assets or stock imagery.
const flairImages = [
  "https://assets.codepen.io/16327/Revised+Flair.png",
  "https://assets.codepen.io/16327/Revised+Flair-1.png",
  "https://assets.codepen.io/16327/Revised+Flair-2.png",
  "https://assets.codepen.io/16327/Revised+Flair-3.png",
  "https://assets.codepen.io/16327/Revised+Flair-4.png",
  "https://assets.codepen.io/16327/Revised+Flair-5.png",
  "https://assets.codepen.io/16327/Revised+Flair-6.png",
  "https://assets.codepen.io/16327/Revised+Flair-7.png",
  "https://assets.codepen.io/16327/Revised+Flair-8.png",
  "https://assets.codepen.io/16327/Revised+Flair.png",
  "https://assets.codepen.io/16327/Revised+Flair-1.png",
  "https://assets.codepen.io/16327/Revised+Flair-2.png",
  "https://assets.codepen.io/16327/Revised+Flair-3.png",
  "https://assets.codepen.io/16327/Revised+Flair-4.png",
  "https://assets.codepen.io/16327/Revised+Flair-5.png",
  "https://assets.codepen.io/16327/Revised+Flair-6.png",
  "https://assets.codepen.io/16327/Revised+Flair-7.png",
  "https://assets.codepen.io/16327/Revised+Flair-8.png",
];

interface MouseTrailComponentProps {
  /** Image URLs stamped along the trail. Defaults to the flair confetti set. */
  images?: string[];
  /** Pixels the pointer must travel before the next image is placed. */
  threshold?: number;
  /**
   * When true, renders as a full-viewport cursor layer via a portal on
   * document.body (immune to transformed ancestors) with no helper text.
   * When false (default), renders the standalone demo markup.
   */
  overlay?: boolean;
  /** Rendered width of each trail image in px (overlay mode). */
  imageSize?: number;
  /** Stacking context for the overlay layer. */
  zIndex?: number;
}

export function MouseTrailComponent({
  images = flairImages,
  threshold = 100,
  overlay = false,
  imageSize = 80,
  zIndex = 9999,
}: MouseTrailComponentProps = {}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ImageTrailController | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!contentRef.current) return;

    const flairElements = Array.from(
      contentRef.current.querySelectorAll('.flair')
    ) as HTMLElement[];

    const controller = new ImageTrailController(flairElements, threshold);
    controllerRef.current = controller;
    controller.init();

    const handleMouseMove = (e: MouseEvent) => {
      controller.setMousePos(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      controller.destroy();
    };
    // Re-init if the image set or threshold changes.
  }, [images, threshold, mounted]);

  if (overlay) {
    if (!mounted) return null;
    return createPortal(
      <div
        ref={contentRef}
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex }}
      >
        {images.map((src, index) => (
          <img
            key={index}
            className="flair"
            src={src}
            alt=""
            style={{ width: imageSize, height: 'auto' }}
          />
        ))}
      </div>,
      document.body
    );
  }

  return (
    <>
      <p>wiggle your mouse around.</p>
      <div className="content" ref={contentRef}>
        {images.map((src, index) => (
          <img
            key={index}
            className="flair"
            src={src}
            alt=""
            style={{ width: imageSize, height: 'auto' }}
          />
        ))}
      </div>
    </>
  );
}
