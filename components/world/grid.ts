import * as THREE from "three";
import { Card, type CardProject } from "./cards";

/* A grade de projetos no 3D. Câmera própria em que 1 unidade = 1px no plano
   z=0, então as posições vêm direto do arrasto em pixels (ProjectsGrid.tsx).
   A superfície curva de leve quando se arrasta rápido; abrir um projeto faz
   a capa crescer até a tela inteira. */
export class GridLayer {
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(30, 1, 10, 20000);
  private res = new THREE.Vector2(1, 1);
  private items: Card[] = [];
  private cw = 300; private ch = 225;
  private vel = new THREE.Vector2(); private velS = new THREE.Vector2();
  private hoverI = -1;
  private gen = 0;
  private dive: { i: number; t: number; done: () => void } | null = null;

  api = {
    setItems: (list: CardProject[], w: number, h: number) => {
      this.gen++;
      this.cw = w; this.ch = h;
      // mesma lista (só mudou o tamanho): reaproveita os cards, sem refazer a entrada
      if (this.items.length === list.length && this.items.every((c, i) => c.p.id === list[i].id)) {
        this.items.forEach((c) => { c.setSize(w, h); c.alphaT = 1; c.fadeSlow = false; c.mesh.renderOrder = 0; c.u.uFull.value = 0; });
        this.hoverI = -1; this.dive = null;
        return;
      }
      this.items.forEach((c) => { this.scene.remove(c.mesh); c.dispose(); });
      this.items = list.map((p) => {
        const c = new Card(p, { grid: true, segs: 20 });
        c.setSize(w, h); c.u.uRes.value = this.res; c.mesh.visible = false;
        this.scene.add(c.mesh);
        return c;
      });
      this.hoverI = -1; this.dive = null;
    },
    setPos: (i: number, x: number, y: number) => {
      const c = this.items[i];
      if (!c || (this.dive && this.dive.i === i)) return;
      c.mesh.position.set(x + this.cw / 2 - this.res.x / 2, this.res.y / 2 - (y + this.ch / 2), 0);
      c.mesh.visible = x > -this.cw - 200 && x < this.res.x + 200 && y > -this.ch - 200 && y < this.res.y + 200;
    },
    setVel: (x: number, y: number) => { this.vel.set(x, -y); },
    setHover: (i: number) => {
      if (i === this.hoverI) return;
      this.items[this.hoverI]?.setFocus(false); this.items[i]?.setFocus(true); this.hoverI = i;
    },
    dive: (i: number) => new Promise<void>((done) => {
      const c = this.items[i]; if (!c) return done();
      c.mesh.renderOrder = 10; c.mesh.position.z = 1;
      this.items.forEach((o, k) => { if (k !== i) o.alphaT = 0; });
      this.dive = { i, t: 0, done };
    }),
    /** some com a grade; a capa aberta, se houver, sai por último */
    clear: () => {
      const d = this.dive;
      // a capa aberta se dissolve por cima da página que entra (sem arrastar)
      this.items.forEach((c) => { c.alphaT = 0; c.fadeSlow = false; });
      const old = this.items, gen = ++this.gen;
      setTimeout(() => {
        if (this.items !== old || this.gen !== gen) return;
        old.forEach((c) => { this.scene.remove(c.mesh); c.dispose(); });
        this.items = [];
      }, 2500);
      this.dive = null;
    },
  };

  resize(w: number, h: number) {
    this.res.set(w, h);
    this.cam.aspect = w / h;
    this.cam.position.set(0, 0, (h / 2) / Math.tan(THREE.MathUtils.degToRad(15)));
    this.cam.far = this.cam.position.z * 3;
    this.cam.updateProjectionMatrix();
  }

  render(r: THREE.WebGLRenderer, dt: number) {
    if (!this.items.length) return;
    this.velS.lerp(this.vel, 1 - Math.exp(-8 * dt));
    const speed = Math.min(1, this.velS.length() / 40);
    const bend = speed * 180;
    this.items.forEach((c, k) => {
      c.u.uBend.value = bend; c.u.uVel.value.copy(this.velS);
      c.u.uSide.value = this.res.x < 760 ? 120 : 260;
      if (this.dive && this.dive.i === k) {
        this.dive.t = Math.min(1, this.dive.t + dt / 0.6);
        const e = 1 - Math.pow(1 - this.dive.t, 4);
        c.u.uFull.value = e; c.u.uVel.value.set(0, 0); c.u.uBend.value = 0; c.u.uSide.value *= 1 - e;
        if (this.dive.t >= 1) { const d = this.dive.done; this.dive.done = () => {}; d(); }
      }
      c.update(dt);
    });
    const ac = r.autoClear;
    r.autoClear = false;
    r.clearDepth();
    r.render(this.scene, this.cam);
    r.autoClear = ac;
  }

  dispose() { this.items.forEach((c) => c.dispose()); }
}
