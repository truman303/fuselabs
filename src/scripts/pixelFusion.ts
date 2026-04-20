import { gsap } from 'gsap';

/**
 * Hero "Signal Lock" animation.
 *
 * Conceptually: the mark is a transmission being acquired. It starts
 * out-of-focus and scrambled, then the system "tunes in" — pixels
 * rain into their grid positions row by row, a cyan scanline sweeps
 * down the composition etching the frames on as it passes, the tab
 * and notch snap in with a crisp overshoot, and a final focus pulse
 * confirms the lock.
 *
 * Sequence:
 *   1. Mark fades in from blurred + desaturated state (the "tune" move).
 *   2. Pixels fall into place row-by-row from above with a slight
 *      rotation and overshoot — think bits locking into a register.
 *   3. A cyan scanline + leading edge sweeps top → bottom across the
 *      whole mark. Both frames stroke on while the beam is travelling
 *      so they appear to be "etched" by the pass.
 *   4. The cyan tab and the front-frame notch snap in with back.out
 *      overshoot as a calibration detail.
 *   5. A quick focus pulse (scale + glow) confirms the lock.
 *   6. Idle: the scanline occasionally revisits, and a handful of
 *      accent pixels breathe.
 *
 * gsap.matchMedia() gates the whole sequence; reduced-motion users
 * get the final state with zero duration and no idle loop.
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
      const frontFrame =
        document.querySelector<SVGRectElement>('.pixel-frame--front');
      const backFrame =
        document.querySelector<SVGRectElement>('.pixel-frame--back');
      const frontNotch =
        document.querySelector<SVGPathElement>('.pixel-frame-notch');
      const backTab = document.querySelector<SVGLineElement>(
        '.pixel-frame-tab--back',
      );
      const scanBeam = document.querySelector<SVGRectElement>('.pixel-scanline');
      const scanEdge = document.querySelector<SVGLineElement>(
        '.pixel-scanline-edge',
      );
      const pixels = gsap.utils.toArray<SVGRectElement>('.pixel');
      const accents = pixels.filter((p) => p.dataset.accent === 'true');
      const chars = gsap.utils.toArray<HTMLElement>('.hero__chars');
      const lede = document.querySelector<HTMLElement>('.hero__lede');
      const actions = document.querySelector<HTMLElement>('.hero__actions');
      const markCaption = document.querySelector<HTMLElement>(
        '.hero__mark-caption',
      );
      const scroll = document.querySelector<HTMLElement>('.hero__scroll');

      if (!svg || !frontFrame || !backFrame || pixels.length === 0) return;

      // Figure out the scan-line travel range from the SVG's viewBox so
      // the beam sweeps exactly across the composition.
      const vb = svg.viewBox.baseVal;
      const scanStartY = vb.y - 72;
      const scanEndY = vb.y + vb.height + 20;

      gsap.set(chars, { yPercent: 110 });

      if (reduceMotion) {
        gsap.set(svg, { autoAlpha: 1, filter: 'none' });
        gsap.set(pixels, {
          opacity: 1,
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
        });
        gsap.set([frontFrame, backFrame], { strokeDashoffset: 0 });
        gsap.set([frontNotch, backTab], { autoAlpha: 1, scale: 1 });
        gsap.set(chars, { yPercent: 0 });
        gsap.set([lede, actions, markCaption, scroll], { autoAlpha: 1 });
        gsap.set([scanBeam, scanEdge], { autoAlpha: 0 });
        return;
      }

      // --- Initial "out of focus" state -------------------------------
      // The SVG starts hidden/blurred via CSS to avoid any pre-animation
      // flash. Here we just ensure the GSAP-tracked properties agree,
      // then a timeline tween will "tune it in".

      pixels.forEach((p) => {
        const row = Number(p.dataset.row ?? 0);
        const rowDrop = 220 + row * 14; // deeper rows fall a bit further
        gsap.set(p, {
          x: (Math.random() - 0.5) * 40,
          y: -rowDrop - Math.random() * 30,
          rotation: (Math.random() - 0.5) * 55,
          scale: 0.55 + Math.random() * 0.3,
          opacity: 0,
          transformOrigin: '50% 50%',
        });
      });

      gsap.set([backTab, frontNotch], {
        autoAlpha: 0,
        scale: 0,
        transformOrigin: '50% 50%',
      });

      // Scanline parks above the viewBox with its leading edge slightly
      // ahead of the glow beam.
      gsap.set(scanBeam, {
        y: scanStartY - vb.y,
        autoAlpha: 0,
      });
      gsap.set(scanEdge, {
        y: scanStartY + 72 - vb.y,
        autoAlpha: 0,
      });

      // --- Master timeline --------------------------------------------
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        delay: 0.15,
      });

      // 1. Tune in — blur resolves, mark fades in. The initial filter
      //    function list is declared in CSS; we tween to the same
      //    function list so the browser can interpolate cleanly.
      tl.to(svg, {
        autoAlpha: 1,
        filter: 'blur(0px) brightness(1) saturate(1)',
        duration: 1.1,
        ease: 'power2.out',
      });

      // 2. Raster drop — pixels fall row-by-row into their slots.
      //    The array is authored top-to-bottom in Hero.astro, so the
      //    default stagger direction gives us a natural rain.
      tl.to(
        pixels,
        {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          opacity: 1,
          duration: 0.85,
          ease: 'back.out(1.6)',
          stagger: { amount: 0.85, from: 'start' },
        },
        '-=0.75',
      );

      // 3a. Scanline materialises + sweeps top → bottom across the mark.
      tl.to(
        [scanBeam, scanEdge],
        { autoAlpha: 1, duration: 0.25, ease: 'power1.out' },
        '-=0.85',
      );

      tl.to(
        scanBeam,
        {
          y: scanEndY - vb.y - 72,
          duration: 1.5,
          ease: 'power2.inOut',
        },
        '<',
      ).to(
        scanEdge,
        {
          y: scanEndY - vb.y,
          duration: 1.5,
          ease: 'power2.inOut',
        },
        '<',
      );

      // 3b. Frames stroke on during the sweep so they look "etched" in
      //     by the beam's passage. Back first (further away), then front.
      tl.to(
        backFrame,
        { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' },
        '-=1.3',
      ).to(
        frontFrame,
        { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' },
        '-=0.95',
      );

      // 3c. Scanline exits once it has cleared the mark.
      tl.to(
        [scanBeam, scanEdge],
        { autoAlpha: 0, duration: 0.35, ease: 'power2.out' },
        '-=0.1',
      );

      // 4. Calibration details — tab + notch snap in with overshoot.
      tl.to(
        backTab,
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.55,
          ease: 'back.out(2.6)',
        },
        '-=0.35',
      ).to(
        frontNotch,
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.55,
          ease: 'back.out(2.6)',
        },
        '-=0.4',
      );

      // 5. Focus pulse — quick breath on the whole mark, plus an
      //    accent glow pulse.
      tl.to(
        svg,
        {
          scale: 1.025,
          duration: 0.22,
          ease: 'power2.out',
          transformOrigin: '50% 50%',
        },
        '-=0.2',
      ).to(svg, {
        scale: 1,
        duration: 0.5,
        ease: 'power3.out',
      });

      // Accent "lock confirmed" flash — quick scale + opacity pulse
      // synced to the focus pulse. Works on fill-box transforms set
      // earlier via CSS (transform-box: fill-box).
      tl.to(
        accents,
        {
          scale: 1.25,
          duration: 0.22,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1,
          stagger: { each: 0.04, from: 'random' },
        },
        '-=0.7',
      );

      // --- Textual choreography (runs alongside the mark) --------------
      // Kicks in just after the tune-in resolves so readers aren't
      // overwhelmed by simultaneous motion.
      tl.to(
        chars,
        {
          yPercent: 0,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.08,
        },
        0.35,
      )
        .to(
          lede,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
          },
          0.95,
        )
        .to(
          [actions, markCaption],
          {
            autoAlpha: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
          },
          1.25,
        )
        .to(
          scroll,
          { autoAlpha: 1, duration: 0.6 },
          1.6,
        )
        .add(() => startIdleLoop(accents, scanBeam, scanEdge, vb), '+=0.05');

      return () => {
        tl.kill();
      };
    },
  );

  // Subtle parallax on pointer — refined and easy to kill.
  mm.add('(hover: hover) and (prefers-reduced-motion: no-preference)', () => {
    const svg = document.querySelector<SVGSVGElement>('.pixel-svg');
    if (!svg) return;
    const onMove = (e: MouseEvent) => {
      const rect = svg.getBoundingClientRect();
      const mx = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const my = (e.clientY - rect.top - rect.height / 2) / rect.height;
      gsap.to(svg, {
        x: mx * 16,
        y: my * 16,
        rotationX: -my * 3.5,
        rotationY: mx * 3.5,
        duration: 0.9,
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
 * Idle loop after the intro lands:
 *   - A gentle scanline "re-sync" every ~11s.
 *   - A few accent pixels breathe so the mark never feels fully static.
 */
function startIdleLoop(
  accents: SVGRectElement[],
  scanBeam: SVGRectElement | null,
  scanEdge: SVGLineElement | null,
  vb: SVGRect,
): void {
  // Breathing accents.
  const pick = gsap.utils
    .shuffle([...accents])
    .slice(0, Math.min(4, accents.length));

  pick.forEach((el, i) => {
    gsap.to(el, {
      opacity: 0.38,
      duration: 0.9 + Math.random() * 0.6,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: i * 0.45 + Math.random() * 0.6,
    });
  });

  // Periodic scanline resync.
  if (!scanBeam || !scanEdge) return;

  const scanStartY = vb.y - 72;
  const scanEndY = vb.y + vb.height + 20;

  const resync = gsap.timeline({ repeat: -1, repeatDelay: 9 });
  resync
    .set([scanBeam, scanEdge], { autoAlpha: 0 })
    .set(scanBeam, { y: scanStartY - vb.y })
    .set(scanEdge, { y: scanStartY + 72 - vb.y })
    .to([scanBeam, scanEdge], {
      autoAlpha: 0.6,
      duration: 0.3,
      ease: 'power1.out',
    })
    .to(
      scanBeam,
      { y: scanEndY - vb.y - 72, duration: 2.4, ease: 'power1.inOut' },
      '<',
    )
    .to(
      scanEdge,
      { y: scanEndY - vb.y, duration: 2.4, ease: 'power1.inOut' },
      '<',
    )
    .to([scanBeam, scanEdge], {
      autoAlpha: 0,
      duration: 0.4,
      ease: 'power2.out',
    });
}
