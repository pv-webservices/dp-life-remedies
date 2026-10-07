type Layout = 'grid' | 'list';
interface FilterState {
  q: string;
  segment: string;
  form: string;
  sort: '' | 'az' | 'za';
  view: Layout;
}

const SEARCH_DEBOUNCE_MS = 120;
const STAGGER_MS = 50;

const readState = (): FilterState => {
  const params = new URLSearchParams(location.search);
  const sort = params.get('sort');
  return {
    q: params.get('q') ?? '',
    segment: params.get('segment') ?? '',
    form: params.get('form') ?? '',
    sort: sort === 'az' || sort === 'za' ? sort : '',
    view: params.get('view') === 'list' ? 'list' : 'grid',
  };
};

const writeState = (state: FilterState): void => {
  const url = new URL(location.href);
  const entries: [string, string][] = [
    ['q', state.q.trim()],
    ['segment', state.segment],
    ['form', state.form],
    ['sort', state.sort],
    ['view', state.view === 'list' ? 'list' : ''],
  ];
  for (const [key, value] of entries) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  history.replaceState(history.state, '', url);
};

function wireEnquireButtons(root: HTMLElement): void {
  const aside = root.querySelector<HTMLElement>('#quick-enquiry');
  const select = aside?.querySelector<HTMLSelectElement>(
    '[data-product-select]',
  );
  if (!aside || !select) return;
  root.addEventListener('click', (e) => {
    const trigger = (e.target as HTMLElement).closest<HTMLAnchorElement>(
      '[data-enquire]',
    );
    if (!trigger || !root.contains(trigger)) return;
    e.preventDefault();
    select.value = trigger.dataset.enquire ?? '';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    aside.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    });
    aside.classList.remove('is-highlighted');
    void aside.offsetWidth;
    aside.classList.add('is-highlighted');
    aside
      .querySelector<HTMLInputElement>('input[name="name"]')
      ?.focus({ preventScroll: true });
  });
}

export function initExplorer(): void {
  const root = document.querySelector<HTMLElement>('[data-explorer]');
  if (!root) return;
  const grid = root.querySelector<HTMLElement>('[data-grid]')!;
  const cards = Array.from(
    grid.querySelectorAll<HTMLElement>('[data-product]'),
  );
  const search = root.querySelector<HTMLInputElement>('[data-filter-q]')!;
  const formSelect =
    root.querySelector<HTMLSelectElement>('[data-filter-form]')!;
  const sortSelect =
    root.querySelector<HTMLSelectElement>('[data-filter-sort]')!;
  const chips = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-segment-filter]'),
  );
  const viewButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-view]'),
  );
  const count = root.querySelector<HTMLElement>('[data-count]')!;
  const empty = root.querySelector<HTMLElement>('[data-empty]')!;
  const resets = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-reset]'),
  );
  const total = cards.length;

  const state = readState();
  if (!chips.some((c) => c.dataset.segmentFilter === state.segment))
    state.segment = '';
  if (![...formSelect.options].some((o) => o.value === state.form))
    state.form = '';

  const sync = () => {
    search.value = state.q;
    formSelect.value = state.form;
    sortSelect.value = state.sort;
    chips.forEach((c) =>
      c.setAttribute(
        'aria-pressed',
        String(c.dataset.segmentFilter === state.segment),
      ),
    );
    viewButtons.forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.view === state.view)),
    );
    grid.dataset.layout = state.view;
  };

  const apply = (animate: boolean) => {
    const query = state.q.trim().toLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);
    const visible = cards.filter((card) => {
      const match =
        terms.every((t) => card.dataset.search?.includes(t)) &&
        (!state.segment || card.dataset.segment === state.segment) &&
        (!state.form || card.dataset.form === state.form);
      card.hidden = !match;
      return match;
    });

    const ordered = [...cards].sort((a, b) => {
      if (!state.sort) return Number(a.dataset.order) - Number(b.dataset.order);
      const cmp = (a.dataset.name ?? '').localeCompare(b.dataset.name ?? '');
      return state.sort === 'az' ? cmp : -cmp;
    });
    ordered.forEach((card) => grid.append(card));

    if (animate) {
      ordered
        .filter((c) => !c.hidden)
        .forEach((card, i) => {
          card.classList.remove('is-entering');
          card.style.setProperty('--d', `${i * STAGGER_MS}ms`);
          void card.offsetWidth;
          card.classList.add('is-entering');
        });
    }

    const n = visible.length;
    count.innerHTML = `Showing <strong>${n}</strong> of ${total} ${total === 1 ? 'product' : 'products'}`;
    empty.hidden = n > 0;
    grid.hidden = n === 0;
    const filtered = Boolean(query || state.segment || state.form);
    resets.forEach((r) => {
      if (r.closest('.results-bar')) r.hidden = !filtered;
    });
    writeState(state);
  };

  let debounce: number | undefined;
  search.addEventListener('input', () => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => {
      state.q = search.value;
      apply(true);
    }, SEARCH_DEBOUNCE_MS);
  });
  formSelect.addEventListener('change', () => {
    state.form = formSelect.value;
    apply(true);
  });
  sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value as FilterState['sort'];
    apply(true);
  });
  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      state.segment = chip.dataset.segmentFilter ?? '';
      sync();
      apply(true);
    }),
  );
  viewButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
      state.view = btn.dataset.view === 'list' ? 'list' : 'grid';
      sync();
      apply(true);
    }),
  );
  resets.forEach((btn) =>
    btn.addEventListener('click', () => {
      Object.assign(state, { q: '', segment: '', form: '', sort: '' });
      sync();
      apply(true);
      search.focus();
    }),
  );

  sync();
  apply(false);
  wireEnquireButtons(root);
}
