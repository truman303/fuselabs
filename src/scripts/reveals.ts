import { gsap } from 'gsap';

/**
 * Scroll-triggered reveals using IntersectionObserver + GSAP.
 * We avoid the ScrollTrigger plugin intentionally — core + IO is lighter
 * and the effect is simple enough.
 */
export function initReveals(): void {
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

      const targets = gsap.utils.toArray<HTMLElement>('.reveal');
      if (targets.length === 0) return;

      if (reduceMotion) {
        gsap.set(targets, { autoAlpha: 1, y: 0 });
        return;
      }

      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            gsap.to(el, {
              autoAlpha: 1,
              y: 0,
              duration: 0.9,
              ease: 'expo.out',
            });
            io.unobserve(el);
          }
        },
        { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
      );

      targets.forEach((el) => io.observe(el));

      return () => io.disconnect();
    },
  );
}
