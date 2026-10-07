const prefersReduced = (): boolean =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Scroll-triggered reveals; elements stay visible when motion is unavailable. */
export function initMotion(): void {
  const root = document.documentElement;
  if (!root.classList.contains('motion-ok')) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  );
  document
    .querySelectorAll('[data-reveal]')
    .forEach((el) => observer.observe(el));
}

/** Horizontal product rail with buttons, keyboard scrolling and a progress bar. */
export function initRail(): void {
  document.querySelectorAll<HTMLElement>('[data-rail]').forEach((rail) => {
    const section = rail.closest('section');
    const track = rail.querySelector<HTMLElement>('[data-rail-track]');
    const bar = rail.querySelector<HTMLElement>('[data-rail-bar]');
    const prev = section?.querySelector<HTMLButtonElement>('[data-rail-prev]');
    const next = section?.querySelector<HTMLButtonElement>('[data-rail-next]');
    if (!track) return;

    // Scroll by the number of fully visible cards (at least one).
    const step = () => {
      const card = track.firstElementChild as HTMLElement | null;
      if (!card) return track.clientWidth;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const pitch = card.offsetWidth + gap;
      return pitch * Math.max(1, Math.floor(track.clientWidth / pitch) - 1);
    };
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const visible = track.clientWidth / track.scrollWidth;
      const progress =
        max > 0 ? visible + (1 - visible) * (track.scrollLeft / max) : 1;
      bar?.style.setProperty('--progress', progress.toFixed(3));
      if (prev) prev.disabled = track.scrollLeft <= 4;
      if (next) next.disabled = track.scrollLeft >= max - 4;
    };
    const go = (dir: 1 | -1) =>
      track.scrollBy({
        left: dir * step(),
        behavior: prefersReduced() ? 'auto' : 'smooth',
      });

    prev?.addEventListener('click', () => go(-1));
    next?.addEventListener('click', () => go(1));
    track.addEventListener('scroll', () => requestAnimationFrame(update), {
      passive: true,
    });
    window.addEventListener('resize', update, { passive: true });
    update();
  });
}

/** Accessible tabs (WAI-ARIA pattern). Without JS every panel is shown in sequence. */
export function initTabs(): void {
  document.querySelectorAll<HTMLElement>('[data-tabs]').forEach((root) => {
    const tabs = Array.from(
      root.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
    const panels = tabs.map((t) =>
      document.getElementById(t.getAttribute('aria-controls') ?? ''),
    );
    const select = (index: number, focus = false) => {
      tabs.forEach((tab, i) => {
        const active = i === index;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        const panel = panels[i];
        if (panel) {
          panel.hidden = !active;
          panel.tabIndex = 0;
        }
      });
      if (focus) tabs[index].focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', (e) => {
        const keys: Record<string, number> = {
          ArrowRight: (i + 1) % tabs.length,
          ArrowLeft: (i - 1 + tabs.length) % tabs.length,
          Home: 0,
          End: tabs.length - 1,
        };
        if (e.key in keys) {
          e.preventDefault();
          select(keys[e.key], true);
        }
      });
    });
    select(0);
  });
}

/** Product image lightbox using the native <dialog>. */
export function initLightbox(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox]');
  const opener = document.querySelector<HTMLButtonElement>(
    '[data-lightbox-open]',
  );
  if (!dialog || !opener) return;
  opener.addEventListener('click', () => {
    dialog.showModal();
    document.body.classList.add('is-locked');
  });
  dialog
    .querySelector('[data-lightbox-close]')
    ?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('is-locked');
    opener.focus();
  });
}
