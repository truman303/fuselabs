import { gsap } from 'gsap';

/**
 * Hero "Signal Lock" animation.
 *
 * Conceptually: the mark is a transmission being acquired. It starts
 * out-of-focus and scrambled, then the system "tunes in" — pixels
 * rain into their grid positions row by row, the frames stroke on,
 * the tab and notch snap in with a crisp overshoot, and a final focus
 * pulse confirms the lock.
 *
 * Sequence:
 *   1. Mark fades in from blurred + desaturated state (the "tune" move).
 *   2. Pixels fall into place row-by-row from above with a slight
 *      rotation and overshoot — think bits locking into a register.
 *   3. Frames stroke on (cyan back first, then bone front) so they feel
 *      drawn in.
 *   4. The front-frame notch snaps in with back.out overshoot as a
 *      calibration detail.
 *   5. A quick focus pulse (scale + glow) confirms the lock.
 *   6. Idle: a handful of accent pixels breathe so the mark never
 *      feels fully static.
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

      const scene = document.querySelector<HTMLElement>('.pixel-scene');
      const sceneInner =
        document.querySelector<HTMLElement>('.pixel-scene-inner');
      const frontFrame =
        document.querySelector<SVGRectElement>('.pixel-frame--front');
      const backFrame =
        document.querySelector<SVGRectElement>('.pixel-frame--back');
      const frontNotch =
        document.querySelector<SVGPathElement>('.pixel-frame-notch');
      const pixels = gsap.utils.toArray<SVGRectElement>('.pixel');
      const accents = pixels.filter((p) => p.dataset.accent === 'true');
      const chars = gsap.utils.toArray<HTMLElement>('.hero__chars');
      const lede = document.querySelector<HTMLElement>('.hero__lede');
      const actions = document.querySelector<HTMLElement>('.hero__actions');
      const markCaption = document.querySelector<HTMLElement>(
        '.hero__mark-caption',
      );
      const scroll = document.querySelector<HTMLElement>('.hero__scroll');

      if (
        !scene ||
        !sceneInner ||
        !frontFrame ||
        !backFrame ||
        pixels.length === 0
      )
        return;

      gsap.set(chars, { yPercent: 110 });

      if (reduceMotion) {
        gsap.set(scene, { autoAlpha: 1, filter: 'none' });
        gsap.set(pixels, {
          opacity: 1,
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
        });
        gsap.set([frontFrame, backFrame], { strokeDashoffset: 0 });
        gsap.set(frontNotch, { autoAlpha: 1, scale: 1 });
        gsap.set(chars, { yPercent: 0 });
        gsap.set([lede, actions, markCaption, scroll], { autoAlpha: 1 });
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

      gsap.set(frontNotch, {
        autoAlpha: 0,
        scale: 0,
        transformOrigin: '50% 50%',
      });

      // --- Master timeline --------------------------------------------
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        delay: 0.15,
      });

      // 1. Tune in — blur resolves, mark fades in. The initial filter
      //    function list is declared in CSS; we tween to the same
      //    function list so the browser can interpolate cleanly.
      //    The filter/opacity live on the scene container so all three
      //    depth planes tune in together.
      tl.to(scene, {
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

      // 3. Frames stroke on alongside the pixel rain — back first
      //    (further away in Z) then front, so the depth reads clearly.
      tl.to(
        backFrame,
        { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' },
        '-=0.65',
      ).to(
        frontFrame,
        { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' },
        '-=0.9',
      );

      // 4. Calibration detail — front-frame notch snaps in with overshoot.
      tl.to(
        frontNotch,
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.55,
          ease: 'back.out(2.6)',
        },
        '-=0.35',
      );

      // 5. Focus pulse — quick breath on the whole mark, plus an
      //    accent glow pulse. Applied to the outer scene container
      //    (2D transform) so it composes cleanly with the inner 3D
      //    rotation without re-parsing the matrix.
      tl.to(
        scene,
        {
          scale: 1.025,
          duration: 0.22,
          ease: 'power2.out',
          transformOrigin: '58% 48%',
        },
        '-=0.2',
      ).to(scene, {
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
        .add(() => startIdleLoop(accents), '+=0.05');

      return () => {
        tl.kill();
      };
    },
  );

  // Subtle parallax on pointer — refined and easy to kill. Tilts the
  // inner 3D group on top of its base rotation so the mark feels
  // like a physical screen responding to the cursor.
  mm.add('(hover: hover) and (prefers-reduced-motion: no-preference)', () => {
    const scene = document.querySelector<HTMLElement>('.pixel-scene');
    const sceneInner = document.querySelector<HTMLElement>(
      '.pixel-scene-inner',
    );
    if (!scene || !sceneInner) return;

    // Base rotation matches the CSS on .pixel-scene-inner.
    const BASE_X = 7;
    const BASE_Y = -12;
    const BASE_Z = -1;

    const onMove = (e: MouseEvent) => {
      const rect = scene.getBoundingClientRect();
      const mx = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const my = (e.clientY - rect.top - rect.height / 2) / rect.height;
      gsap.to(sceneInner, {
        rotationX: BASE_X + -my * 4,
        rotationY: BASE_Y + mx * 5,
        rotationZ: BASE_Z,
        duration: 0.9,
        ease: 'power3.out',
        transformOrigin: '58% 48%',
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  });
}

/**
 * Idle loop after the intro lands: a few accent pixels breathe so the
 * mark never feels fully static.
 */
function startIdleLoop(accents: SVGRectElement[]): void {
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
}
