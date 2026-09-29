// Image-trail engine used by components/ui/mouse-trail.tsx.
//
// Dependency-free port of the classic "flair" image-trail effect: as the
// pointer travels past `threshold` pixels, the next image in the pool is
// stamped at the cursor and animated in/out with the Web Animations API.
// No GSAP required. Each element is positioned `fixed` against the viewport,
// so callers feed it raw clientX/clientY (see setMousePos).

export class ImageTrailController {
  private images: HTMLElement[];
  private threshold: number;
  private mouseX = 0;
  private mouseY = 0;
  private lastX = 0;
  private lastY = 0;
  private index = 0;
  private stack = 9000;
  private raf: number | null = null;
  private primed = false;

  constructor(images: HTMLElement[], threshold = 100) {
    this.images = images;
    this.threshold = Math.max(1, threshold);
  }

  init() {
    this.images.forEach((img) => {
      img.style.position = "fixed";
      img.style.top = "0";
      img.style.left = "0";
      img.style.opacity = "0";
      img.style.pointerEvents = "none";
      img.style.willChange = "transform, opacity";
      img.style.userSelect = "none";
    });
    this.raf = requestAnimationFrame(this.loop);
  }

  setMousePos(x: number, y: number) {
    this.mouseX = x;
    this.mouseY = y;
    // Prime the reference point on the first real sample so we don't fire a
    // burst of images animating out from (0,0) on mount.
    if (!this.primed) {
      this.primed = true;
      this.lastX = x;
      this.lastY = y;
    }
  }

  private loop = () => {
    const dist = Math.hypot(this.mouseX - this.lastX, this.mouseY - this.lastY);
    if (this.primed && dist > this.threshold) {
      this.show(this.mouseX, this.mouseY);
      this.lastX = this.mouseX;
      this.lastY = this.mouseY;
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private show(x: number, y: number) {
    const img = this.images[this.index];
    if (!img) return;
    this.index = (this.index + 1) % this.images.length;

    this.stack += 1;
    img.style.zIndex = String(this.stack);

    const w = img.offsetWidth || 80;
    const h = img.offsetHeight || 80;
    const px = x - w / 2;
    const py = y - h / 2;
    const rot = (Math.random() - 0.5) * 26; // slight, per-image tilt

    img.animate(
      [
        { transform: `translate(${px}px, ${py}px) scale(0.35) rotate(${rot}deg)`, opacity: 0 },
        { transform: `translate(${px}px, ${py}px) scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.18 },
        { transform: `translate(${px}px, ${py + 46}px) scale(0.82) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: 900, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "forwards" }
    );
  }

  destroy() {
    if (this.raf != null) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.images.forEach((img) => {
      img.style.opacity = "0";
    });
  }
}
