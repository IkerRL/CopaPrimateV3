import { useEffect, useRef, useState } from 'react';

// Título de la pestaña por página (SEO)
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Copa Primate Vol. III` : 'Copa Primate Vol. III · Torneo de Valorant';
  }, [title]);
}

// Animación de aparición al hacer scroll
export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal:not(.visible)');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
            const el = e.target;
            setTimeout(() => { el.style.transitionDelay = ''; }, 1200);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
}

// Contador animado que arranca al entrar en pantalla
export function useCountUp(target, duration = 1400) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target, duration]);

  return [ref, value];
}
