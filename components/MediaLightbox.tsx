'use client';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLenis } from 'lenis/react';

type Media = { type: string; src: string };

/* Visualizador em tela cheia com navegação entre as mídias do projeto.
   - Fixo e centralizado sobre fundo preto.
   - Setas ‹ › (e teclas ←/→) passam para a mídia anterior/próxima.
   - Vídeo: controles + autoplay + botão de tela cheia nativa (gira o celular).
   - Imagem: exibe grande com pinch-zoom no celular.
   Fecha com ✕, Esc ou clique no fundo. */
export default function MediaLightbox({
  items, index, onIndex, onClose,
}: {
  items: Media[] | null;
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const lenis = useLenis();

  const n = items?.length || 0;
  const item = items && n > 0 ? items[((index % n) + n) % n] : null;
  const prev = () => n > 1 && onIndex(((index - 1) % n + n) % n);
  const next = () => n > 1 && onIndex(((index + 1) % n) % n);

  // Teclado: Esc fecha, ←/→ navega. Trava o scroll do fundo.
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    lenis?.stop();   // trava o smooth-scroll do Lenis enquanto o lightbox está aberto
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      lenis?.start();
    };
  }, [item, index, n, lenis]);

  // Pinch-zoom na imagem (2 dedos); solta e volta com mola. Reinicia ao trocar.
  useEffect(() => {
    const el = imgRef.current;
    if (!item || item.type !== 'image' || !el) return;
    el.style.transform = 'scale(1)';
    let startDist = 0, active = false;
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      active = true;
      startDist = dist(e.touches) || 1;
      const r = el.getBoundingClientRect();
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      el.style.transformOrigin = `${((cx - r.left) / r.width) * 100}% ${((cy - r.top) / r.height) * 100}%`;
      el.style.transition = 'none';
    };
    const onMove = (e: TouchEvent) => {
      if (!active || e.touches.length !== 2) return;
      e.preventDefault();
      const scale = Math.max(1, Math.min(4, dist(e.touches) / startDist));
      el.style.transform = `scale(${scale})`;
    };
    const onEnd = (e: TouchEvent) => {
      if (!active || e.touches.length >= 2) return;
      active = false;
      el.style.transition = 'transform .4s cubic-bezier(.16,1,.3,1)';
      el.style.transform = 'scale(1)';
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [item, index]);

  if (!item || typeof document === 'undefined') return null;

  const goFullscreen = () => {
    const v = videoRef.current as any;
    if (!v) return;
    if (typeof v.webkitEnterFullscreen === 'function') { try { v.webkitEnterFullscreen(); return; } catch {} }
    const req = v.requestFullscreen || v.webkitRequestFullscreen || v.mozRequestFullScreen || v.msRequestFullscreen;
    if (req) { try { req.call(v); } catch {} }
  };
  const stop = (e: any) => e.stopPropagation();

  const sideBtn: any = {
    position: 'fixed', top: '50%', transform: 'translateY(-50%)', zIndex: 3,
    width: 48, height: 48, borderRadius: 999,
    background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.25)',
    fontSize: 24, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  // portal no body: escapa ancestrais com transform (Lenis/pull-wrap), senão o
  // position:fixed vira relativo a eles e o lightbox não centraliza (mobile).
  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      data-lenis-prevent
      style={{
        position: 'fixed', inset: 0, zIndex: 100000,
        background: 'rgba(0,0,0,.94)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(12px,3vw,32px)',
        overscrollBehavior: 'contain',
        animation: 'lb-fade .2s ease',
      }}
    >
      <style>{`@keyframes lb-fade { from { opacity: 0 } to { opacity: 1 } }`}</style>

      {/* Fechar */}
      <button
        onClick={(e) => { stop(e); onClose(); }}
        aria-label="Fechar"
        style={{
          position: 'fixed', top: 'max(14px, env(safe-area-inset-top))', right: 16, zIndex: 4,
          width: 42, height: 42, borderRadius: 999,
          background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.25)',
          fontSize: 18, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >✕</button>

      {/* Navegação */}
      {n > 1 && (
        <>
          <button aria-label="Anterior" onClick={(e) => { stop(e); prev(); }} style={{ ...sideBtn, left: 'clamp(8px,2vw,20px)' }}>‹</button>
          <button aria-label="Próximo" onClick={(e) => { stop(e); next(); }} style={{ ...sideBtn, right: 'clamp(8px,2vw,20px)' }}>›</button>
          <div style={{
            position: 'fixed', top: 'max(18px, env(safe-area-inset-top))', left: '50%', transform: 'translateX(-50%)', zIndex: 4,
            color: 'rgba(255,255,255,.75)', fontSize: 12, letterSpacing: '.08em',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}>{(((index % n) + n) % n) + 1} / {n}</div>
        </>
      )}

      {item.type === 'video' ? (
        <>
          <video
            key={item.src}
            ref={videoRef}
            src={item.src}
            controls
            autoPlay
            playsInline
            onClick={stop}
            style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', display: 'block', borderRadius: 6 }}
          />
          <button
            onClick={(e) => { stop(e); goFullscreen(); }}
            style={{
              position: 'fixed', bottom: 'max(18px, env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', zIndex: 4,
              padding: '9px 16px', borderRadius: 999,
              background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.25)',
              fontSize: 11, letterSpacing: '.08em', cursor: 'pointer',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >⛶ tela cheia</button>
        </>
      ) : item.type === 'image' ? (
        <img
          key={item.src}
          ref={imgRef}
          src={item.src}
          alt=""
          onClick={stop}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', touchAction: 'none', willChange: 'transform' }}
        />
      ) : null}
    </div>,
    document.body
  );
}
