// Enquiry forms validate locally and prepare an editable email or WhatsApp draft.
// Nothing is sent automatically and no data leaves the browser until the user sends it.
const WHATSAPP_NUMBER = '917900001029';
const EMAIL = 'dpliferemedies@gmail.com';
const MIN_DIGITS = 10;
const MAX_DIGITS = 15;

const buildDraft = (data: FormData): { text: string; product: string } => {
  const field = (key: string) => String(data.get(key) ?? '').trim();
  const product = field('product');
  const text = [
    'Hello DP Life Remedies,',
    '',
    'I would like to discuss a business enquiry.',
    '',
    `Name: ${field('name')}`,
    `Mobile: ${field('phone')}`,
    `Email: ${field('email') || 'Not provided'}`,
    `Business: ${field('business')}`,
    `City / State: ${field('city') || 'Not provided'}`,
    `Enquiry type: ${field('type') || 'Product information'}`,
    `Product: ${product || 'General / multiple products'}`,
    '',
    'Requirement:',
    field('message'),
  ].join('\n');
  return { text, product };
};

const draftHref = (channel: string, text: string, product: string): string =>
  channel === 'whatsapp'
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
    : `mailto:${EMAIL}?subject=${encodeURIComponent(`Business enquiry${product ? ` — ${product}` : ''}`)}&body=${encodeURIComponent(text)}`;

function preselectProduct(form: HTMLFormElement): void {
  const select = form.querySelector<HTMLSelectElement>('[data-product-select]');
  const slug = new URLSearchParams(location.search).get('product');
  if (!select || !slug) return;
  const option = Array.from(select.options).find(
    (o) => o.dataset.slug === slug,
  );
  if (option) select.value = option.value;
}

export function initEnquiryForms(): void {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document
    .querySelectorAll<HTMLFormElement>('[data-enquiry]')
    .forEach((form) => {
      preselectProduct(form);
      const phone = form.querySelector<HTMLInputElement>('[name="phone"]')!;
      const panel = form.querySelector<HTMLElement>('[data-draft-panel]')!;
      const preview = form.querySelector<HTMLElement>('[data-draft-text]')!;
      const link = form.querySelector<HTMLAnchorElement>('[data-draft-link]')!;
      const copyStatus = form.querySelector<HTMLElement>('[data-copy-status]')!;
      let draft = '';

      const validatePhone = () => {
        const digits = phone.value.replace(/\D/g, '').length;
        const ok =
          /^[+0-9 ()-]*$/.test(phone.value) &&
          digits >= MIN_DIGITS &&
          digits <= MAX_DIGITS;
        phone.setCustomValidity(
          ok ? '' : 'Enter a mobile number with 10 to 15 digits.',
        );
      };
      phone.addEventListener('input', validatePhone);

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        validatePhone();
        if (!form.reportValidity()) return;
        const channel =
          (e.submitter as HTMLButtonElement | null)?.value ?? 'email';
        const { text, product } = buildDraft(new FormData(form));
        draft = text;
        preview.textContent = text;
        link.href = draftHref(channel, text, product);
        link.firstChild!.textContent =
          channel === 'whatsapp' ? 'Open WhatsApp draft ' : 'Open email draft ';
        if (channel === 'whatsapp') {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        } else {
          link.removeAttribute('target');
          link.removeAttribute('rel');
        }
        copyStatus.textContent = '';
        panel.hidden = false;
        link.focus({ preventScroll: true });
        panel.scrollIntoView({
          behavior: reduced ? 'auto' : 'smooth',
          block: 'nearest',
        });
      });

      form.querySelector('[data-copy]')?.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(draft);
          copyStatus.textContent =
            'Copied. Paste the enquiry into your preferred app.';
        } catch {
          copyStatus.textContent =
            'Copy is unavailable. Select the draft text above to copy it manually.';
        }
      });
    });
}
