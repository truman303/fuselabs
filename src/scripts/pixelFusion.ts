import { gsap } from 'gsap';

/**
 * Hero "pixel fusion" animation.
 *
 * Neutral pixels scatter in from random off-frame positions and settle;
 * accent pixels follow with an overshoot ease. The cyan frame strokes in
 * last, then the wordmark reveals. A subtle flicker loop keeps the accents
 * alive once everything has landed.
 *
 * gsap.matchMedia() gates the whole sequence: users who prefer reduced
 * motion get the final state applied with zero duration and no idle loop.
 */
export function initPixelFusion(): void {
  const mm = gsap.matchMedia();

  mm.add(
    {
      reduceMotion: '(prefers-reduced-motion: reduce)',
      fullMotion: '(prefers-reduced-motion: no-preference)',
    },
    (ctx) => {
      const { reduceMotion } = ctx.conditions as {
        reduceMotion: boolean;
        fullMotion: boolean;
      };

      const svg = document.querySelector<SVGSVGElement>('.pixel-svg');
      const frame = document.querySelector<SVGRectElement>('.pixel-frame');
      const pixels = gsap.utils.toArray<SVGRectElement>('.pixel');
      const accents = pixels.filter(
        (p) => p.dataset.accent === 'true',
      );
      const neutrals = pixels.filter(
        (p) => p.dataset.accent !== 'true',
      );
      const chars = gsap.utils.toArray<HTMLElement>('.hero__chars');
      const lede = document.querySelector<HTMLElement>('.hero__lede');
      const actions = document.querySelector<HTMLElement>('.hero__actions');
      const markCaption = document.querySelector<HTMLElement>(
        '.hero__mark-caption',
      );
      const scroll = document.querySelector<HTMLElement>('.hero__scroll');

      if (!svg || !frame || pixels.length === 0) return;

      // Initial state — CSS ships a visible resting state for no-JS fallback,
      // so we push the chars offscreen here in JS before the timeline runs.
      gsap.set(chars, { yPercent: 110 });

      if (reduceMotion) {
        gsap.set(pixels, { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1 });
        gsap.set(frame, { strokeDashoffset: 0 });
        gsap.set(chars, { yPercent: 0 });
        gsap.set([lede, actions, markCaption, scroll], { autoAlpha: 1 });
        return;
      }

      const viewBox = svg.viewBox.baseVal;
      const cx = viewBox.x + viewBox.width / 2;
      const cy = viewBox.y + viewBox.height / 2;

      pixels.forEach((p) => {
        const bx = p.x.baseVal.value + p.width.baseVal.value / 2;
        const by = p.y.baseVal.value + p.height.baseVal.value / 2;
        const dx = bx - cx;
        const dy = by - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const push = 1.2 + Math.random() * 0.9;
        const startX = (dx / (dist || 1)) * 120 * push;
        const startY = (dy / (dist || 1)) * 90 * push;
        gsap.set(p, {
          x: startX + (Math.random() - 0.5) * 40,
          y: startY + (Math.random() - 0.5) * 40,
          rotation: (Math.random() - 0.5) * 180,
          scale: 0.4 + Math.random() * 0.8,
          opacity: 0,
          transformOrigin: '50% 50%',
        });
      });

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        delay: 0.2,
      });

      tl.to(neutrals, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        opacity: 1,
        duration: 1.1,
        stagger: { amount: 0.7, from: 'random' },
      })
        .to(
          accents,
          {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            opacity: 1,
            duration: 1.2,
            ease: 'back.out(2)',
            stagger: { amount: 0.5, from: 'random' },
          },
          '-=0.75',
        )
        .to(
          frame,
          {
            strokeDashoffset: 0,
            duration: 1.2,
            ease: 'power2.inOut',
          },
          '-=0.9',
        )
        .to(
          chars,
          {
            yPercent: 0,
            duration: 0.9,
            ease: 'expo.out',
            stagger: 0.08,
          },
          '-=1.0',
        )
        .to(
          lede,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
          },
          '-=0.5',
        )
        .to(
          [actions, markCaption],
          {
            autoAlpha: 1,
            duration: 0.6,
            stagger: 0.1,
          },
          '-=0.4',
        )
        .to(
          scroll,
          {
            autoAlpha: 1,
            duration: 0.6,
          },
          '-=0.2',
        )
        .add(() => startIdleLoop(accents), '-=0.1');

      return () => {
        tl.kill();
      };
    },
  );

  // Parallax nudge on mouse move — tiny, tasteful
  mm.add('(hover: hover) and (prefers-reduced-motion: no-preference)', () => {
    const svg = document.querySelector<SVGSVGElement>('.pixel-svg');
    if (!svg) return;
    const onMove = (e: MouseEvent) => {
      const rect = svg.getBoundingClientRect();
      const mx = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const my = (e.clientY - rect.top - rect.height / 2) / rect.height;
      gsap.to(svg, {
        x: mx * 18,
        y: my * 18,
        rotationX: -my * 4,
        rotationY: mx * 4,
        duration: 0.8,
        ease: 'power3.out',
        transformPerspective: 900,
        transformOrigin: '50% 50%',
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  });
}

/**
 * Subtle lifelike flicker on a handful of accent pixels.
 * Runs indefinitely; gsap.matchMedia() reverts on teardown.
 */
function startIdleLoop(accents: SVGRectElement[]): void {
  const pick = gsap.utils
    .shuffle([...accents])
    .slice(0, Math.min(4, accents.length));

  pick.forEach((el, i) => {
    gsap.to(el, {
      opacity: 0.35,
      duration: 0.9 + Math.random() * 0.6,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: i * 0.4 + Math.random() * 0.6,
    });
  });
}
