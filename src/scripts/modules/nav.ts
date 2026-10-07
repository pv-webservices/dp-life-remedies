const DESKTOP_NAV = '(min-width: 1081px)';
const FLOAT_THRESHOLD = 480;
const MEGA_CLOSE_DELAY = 180;

function initHeader(): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const float = document.querySelector<HTMLElement>('[data-float]');
  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    header?.classList.toggle('is-scrolled', y > 12);
    float?.classList.toggle('is-visible', y > FLOAT_THRESHOLD);
    ticking = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}

function initDrawer(): void {
  const drawer = document.querySelector<HTMLDialogElement>('[data-drawer]');
  const opener =
    document.querySelector<HTMLButtonElement>('[data-drawer-open]');
  if (!drawer || !opener) return;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const open = () => {
    drawer.showModal();
    opener.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-locked');
  };
  const close = () => {
    if (!drawer.open) return;
    const finish = () => {
      drawer.classList.remove('is-closing');
      drawer.close();
    };
    if (reduced()) return finish();
    drawer.classList.add('is-closing');
    drawer.addEventListener('animationend', finish, { once: true });
  };

  opener.addEventListener('click', open);
  drawer.addEventListener('close', () => {
    opener.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
    opener.focus();
  });
  drawer.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  drawer.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (
      target === drawer ||
      target.closest('[data-drawer-close]') ||
      target.closest('a')
    )
      close();
  });
  matchMedia(DESKTOP_NAV).addEventListener('change', (e) => {
    if (e.matches && drawer.open) drawer.close();
  });
}

function initMegaMenu(): void {
  const mega = document.querySelector<HTMLDetailsElement>('[data-mega]');
  if (!mega) return;
  const summary = mega.querySelector('summary');
  let timer: number | undefined;
  const canHover = () =>
    matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.addEventListener('click', (e) => {
    if (mega.open && !mega.contains(e.target as Node)) mega.open = false;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mega.open) {
      mega.open = false;
      summary?.focus();
    }
  });
  summary?.addEventListener('click', (e) => {
    // Hover already opened the menu; a pointer click should not immediately close it.
    if (canHover() && e.detail > 0 && mega.open) {
      e.preventDefault();
    }
  });
  mega.addEventListener('focusout', (e) => {
    if (!mega.contains(e.relatedTarget as Node)) mega.open = false;
  });
  mega.parentElement?.addEventListener('mouseenter', () => {
    if (!canHover()) return;
    window.clearTimeout(timer);
    mega.open = true;
  });
  mega.parentElement?.addEventListener('mouseleave', () => {
    if (!canHover()) return;
    timer = window.setTimeout(() => (mega.open = false), MEGA_CLOSE_DELAY);
  });
}

export function initNavigation(): void {
  initHeader();
  initDrawer();
  initMegaMenu();
}
