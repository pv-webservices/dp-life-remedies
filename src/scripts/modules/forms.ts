// Enquiry forms: inline validation, then background delivery through FormSubmit's AJAX endpoint
// and a redirect to /thank-you/. Without JavaScript the same form POSTs to FormSubmit directly.
// The visitor's input is never cleared on failure and is kept in sessionStorage until it is sent.
import { business } from '../../data/business';
import { FORM_AJAX, THANK_YOU_PATH } from '../../data/site.mjs';
import {
  FIELD_RULES,
  MIN_FILL_MS,
  REQUEST_TIMEOUT_MS,
  buildSubject,
  buildWhatsAppText,
  formatSubmittedAt,
  sanitize,
  validateEnquiry,
  validateField,
  type FieldError,
  type FieldValues,
} from './enquiry-validation';

const WHATSAPP_NUMBER = business.tel.replace(/\D/g, '');
const DRAFT_PREFIX = 'dp-enquiry:';
const loadedAt = Date.now();

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type Problem = 'offline' | 'timeout' | 'failed' | 'too-fast';

const fieldsOf = (form: HTMLFormElement): Field[] =>
  Array.from(form.elements).filter(
    (el): el is Field =>
      (el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement) &&
      el.name !== '' &&
      !el.name.startsWith('_') &&
      el.type !== 'hidden',
  );

const valuesOf = (form: HTMLFormElement): FieldValues =>
  Object.fromEntries(
    fieldsOf(form).map((el) => [
      el.name,
      el instanceof HTMLInputElement && el.type === 'checkbox'
        ? el.checked
        : el.value,
    ]),
  );

/** Validated field names present in this form, in visual order. */
const ruleNames = (form: HTMLFormElement): string[] =>
  fieldsOf(form)
    .map((el) => el.name)
    .filter((name) => name in FIELD_RULES);

function showFieldError(
  form: HTMLFormElement,
  name: string,
  message: string,
): void {
  const field = form.elements.namedItem(name);
  const error = form.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
  if (field instanceof HTMLElement) {
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
  }
  if (error) error.textContent = message;
}

const link = (
  href: string,
  text: string,
  external = false,
): HTMLAnchorElement => {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  if (external) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  return a;
};

function setAlert(form: HTMLFormElement, title: string, body: Node[]): void {
  const alert = form.querySelector<HTMLElement>('[data-form-alert]')!;
  const heading = document.createElement('strong');
  heading.textContent = title;
  alert.replaceChildren(heading, ...body);
  alert.hidden = false;
}

function clearAlert(form: HTMLFormElement): void {
  const alert = form.querySelector<HTMLElement>('[data-form-alert]')!;
  alert.replaceChildren();
  alert.hidden = true;
}

function showSummary(form: HTMLFormElement, errors: FieldError[]): void {
  const list = document.createElement('ul');
  for (const { name, message } of errors) {
    const field = form.elements.namedItem(name);
    const item = document.createElement('li');
    item.append(
      field instanceof HTMLElement && field.id
        ? link(`#${field.id}`, message)
        : document.createTextNode(message),
    );
    list.append(item);
  }
  const count =
    errors.length === 1 ? '1 field needs' : `${errors.length} fields need`;
  setAlert(form, `Please check the form: ${count} attention.`, [list]);
}

const PROBLEMS: Record<Problem, [string, string]> = {
  offline: [
    'You appear to be offline.',
    'Your enquiry has not been sent and your details are still here. Reconnect and press Send again, or contact us directly:',
  ],
  timeout: [
    'This is taking longer than expected.',
    'We could not confirm that your enquiry was sent. Your details are still here — please try again, or contact us directly:',
  ],
  failed: [
    'Your enquiry could not be delivered.',
    'Something went wrong on our side. Your details are still here — please try again in a moment, or contact us directly:',
  ],
  'too-fast': [
    'Please take a moment to review your details.',
    'Check the form, then press Send enquiry again.',
  ],
};

function showProblem(form: HTMLFormElement, problem: Problem): void {
  const [title, text] = PROBLEMS[problem];
  const intro = document.createElement('p');
  intro.textContent = text;
  const body: Node[] = [intro];
  if (problem !== 'too-fast') {
    const message = buildWhatsAppText(valuesOf(form));
    const actions = document.createElement('ul');
    actions.className = 'alert-actions';
    for (const a of [
      link(`tel:${business.tel}`, `Call ${business.phone}`),
      link(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
        'Send on WhatsApp',
        true,
      ),
      link(
        `mailto:${business.email}?subject=${encodeURIComponent(buildSubject(valuesOf(form)))}&body=${encodeURIComponent(message)}`,
        `Email ${business.email}`,
      ),
    ]) {
      const li = document.createElement('li');
      li.append(a);
      actions.append(li);
    }
    body.push(actions);
  }
  setAlert(form, title, body);
  form.querySelector<HTMLElement>('[data-form-alert]')!.focus();
}

function setBusy(form: HTMLFormElement, busy: boolean): void {
  if (busy) form.setAttribute('aria-busy', 'true');
  else form.removeAttribute('aria-busy');
  form
    .querySelectorAll<HTMLButtonElement>('button')
    .forEach((b) => (b.disabled = busy));
  const label = form.querySelector<HTMLElement>('[data-submit-label]');
  if (label) label.textContent = busy ? 'Sending…' : 'Send enquiry';
  const progress = form.querySelector<HTMLElement>('[data-form-progress]');
  if (progress) progress.textContent = busy ? 'Sending your enquiry…' : '';
}

/** Show errors, focus the first invalid field. Returns true when the given fields are valid. */
function check(form: HTMLFormElement, names: readonly string[]): boolean {
  const errors = validateEnquiry(valuesOf(form), names);
  for (const name of names)
    showFieldError(
      form,
      name,
      errors.find((e) => e.name === name)?.message ?? '',
    );
  if (!errors.length) {
    clearAlert(form);
    return true;
  }
  showSummary(form, errors);
  const first = form.elements.namedItem(errors[0].name);
  if (first instanceof HTMLElement) first.focus();
  return false;
}

// ── Draft persistence (sessionStorage: this tab only, cleared after a successful send) ──
const draftKey = (form: HTMLFormElement) =>
  `${DRAFT_PREFIX}${location.pathname}:${form.dataset.formType ?? ''}`;

function saveDraft(form: HTMLFormElement): void {
  const values = Object.fromEntries(
    fieldsOf(form)
      .filter((el) => el.type !== 'checkbox')
      .map((el) => [el.name, el.value]),
  );
  try {
    sessionStorage.setItem(draftKey(form), JSON.stringify(values));
  } catch {
    // Storage unavailable (private mode or blocked): the fields still hold the input.
  }
}

function restoreDraft(form: HTMLFormElement): void {
  let saved: Record<string, unknown> = {};
  try {
    saved = JSON.parse(sessionStorage.getItem(draftKey(form)) ?? '{}');
  } catch {
    return;
  }
  for (const el of fieldsOf(form)) {
    const value = saved[el.name];
    if (typeof value === 'string' && value && !el.value) el.value = value;
  }
}

function clearDraft(form: HTMLFormElement): void {
  try {
    sessionStorage.removeItem(draftKey(form));
  } catch {
    // Nothing stored.
  }
}

function preselectProduct(form: HTMLFormElement): void {
  const select = form.querySelector<HTMLSelectElement>('[data-product-select]');
  const slug = new URLSearchParams(location.search).get('product');
  if (!select || !slug) return;
  const option = Array.from(select.options).find(
    (o) => o.dataset.slug === slug,
  );
  if (option) select.value = option.value;
}

/** POST the enquiry to FormSubmit's AJAX endpoint with a hard timeout. */
async function deliver(
  payload: Record<string, string>,
): Promise<'sent' | Problem> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(FORM_AJAX, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const result: unknown = await response.json().catch(() => ({}));
    const success = (result as { success?: unknown }).success;
    return response.ok && (success === true || success === 'true')
      ? 'sent'
      : 'failed';
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError')
      return 'timeout';
    return navigator.onLine === false ? 'offline' : 'failed';
  } finally {
    clearTimeout(timer);
  }
}

function payloadFor(form: HTMLFormElement): Record<string, string> {
  const values = valuesOf(form);
  const data = new FormData(form);
  const payload: Record<string, string> = {};
  data.forEach((value, key) => {
    if (typeof value === 'string') payload[key] = sanitize(value);
  });
  payload._subject = buildSubject(values);
  payload.page_url = location.href;
  payload.submitted_at = formatSubmittedAt(new Date());
  delete payload._next; // AJAX responses are handled here; the redirect is ours.
  return payload;
}

function initForm(form: HTMLFormElement): void {
  // JavaScript takes over validation so messages are consistent and linked to their fields.
  form.noValidate = true;
  preselectProduct(form);
  restoreDraft(form);
  const whatsapp = form.querySelector<HTMLButtonElement>('[data-whatsapp]');
  if (whatsapp) whatsapp.hidden = false;

  // Re-check an already-flagged field while it is being corrected, so its message clears as
  // soon as it is fixed. (Doing this on blur would shift the layout under the next click.)
  const recheck = (e: Event) => {
    saveDraft(form);
    const el = e.target;
    if (
      !(el instanceof HTMLElement) ||
      el.getAttribute('aria-invalid') !== 'true'
    )
      return;
    const field = el as Field;
    const value =
      field instanceof HTMLInputElement && field.type === 'checkbox'
        ? field.checked
        : field.value;
    showFieldError(form, field.name, validateField(field.name, value));
  };
  form.addEventListener('input', recheck);
  form.addEventListener('change', recheck);

  whatsapp?.addEventListener('click', () => {
    // Opens the visitor's own WhatsApp; exempt from the bot timer and consent (nothing is sent by us).
    if (!check(form, ['name', 'message'])) return;
    const text = buildWhatsAppText(valuesOf(form));
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener',
    );
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.getAttribute('aria-busy') === 'true') return;
    const honey = form.elements.namedItem('_honey');
    if (honey instanceof HTMLInputElement && honey.value) {
      // Bot: pretend success without sending anything.
      location.assign(THANK_YOU_PATH);
      return;
    }
    if (!check(form, ruleNames(form))) return;
    if (Date.now() - loadedAt < MIN_FILL_MS)
      return showProblem(form, 'too-fast');
    if (navigator.onLine === false) return showProblem(form, 'offline');

    setBusy(form, true);
    const result = await deliver(payloadFor(form));
    if (result === 'sent') {
      clearDraft(form);
      location.assign(THANK_YOU_PATH);
      return;
    }
    setBusy(form, false);
    showProblem(form, result);
  });
}

export function initEnquiryForms(): void {
  const forms = document.querySelectorAll<HTMLFormElement>('[data-enquiry]');
  forms.forEach(initForm);
  // Coming back with the Back button restores the page from cache: re-enable the buttons.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) forms.forEach((form) => setBusy(form, false));
  });
}
