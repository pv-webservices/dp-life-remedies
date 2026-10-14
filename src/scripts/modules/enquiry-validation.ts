// Pure enquiry-form rules shared by the browser controller and the unit tests (no DOM access).

export type FieldKind = 'text' | 'email' | 'phone' | 'checkbox';
export interface FieldRule {
  label: string;
  required: boolean;
  kind: FieldKind;
  min?: number;
  max?: number;
  /** Message shown when a required field is empty. */
  missing?: string;
}
export type FieldValues = Record<string, string | boolean>;
export interface FieldError {
  name: string;
  message: string;
}

export const MIN_PHONE_DIGITS = 10;
export const MAX_PHONE_DIGITS = 15;
/** Submissions faster than this after page load are treated as automated (WhatsApp is exempt). */
export const MIN_FILL_MS = 3000;
export const REQUEST_TIMEOUT_MS = 20_000;
export const BUSINESS_TIME_ZONE = 'Asia/Kolkata';

export const FIELD_RULES: Record<string, FieldRule> = {
  name: {
    label: 'Full name',
    required: true,
    kind: 'text',
    min: 2,
    max: 100,
    missing: 'Enter your full name.',
  },
  phone: {
    label: 'Mobile number',
    required: true,
    kind: 'phone',
    max: 20,
    missing: 'Enter your mobile number.',
  },
  email: {
    label: 'Email address',
    required: true,
    kind: 'email',
    max: 150,
    missing: 'Enter your email address.',
  },
  business: {
    label: 'Business / organisation',
    required: false,
    kind: 'text',
    min: 2,
    max: 150,
  },
  city: {
    label: 'City / state',
    required: false,
    kind: 'text',
    min: 2,
    max: 100,
  },
  message: {
    label: 'Requirement / message',
    required: true,
    kind: 'text',
    min: 10,
    max: 2000,
    missing: 'Tell us about your requirement.',
  },
  consent: {
    label: 'Privacy consent',
    required: true,
    kind: 'checkbox',
    missing:
      'Please agree to the Privacy Policy so we can reply to your enquiry.',
  },
};

// Practical address check: one "@", no spaces, a dot in the domain and a 2+ letter ending.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[A-Za-z]{2,}$/;
const PHONE_CHARS = /^[+0-9 ()-]*$/;
// C0 control characters except tab/newline/carriage return, plus DEL.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Trim and strip control characters from visitor input before it is sent or shown. */
export const sanitize = (value: string): string =>
  value.replace(CONTROL_CHARS, '').trim();

export const digitCount = (value: string): number =>
  value.replace(/\D/g, '').length;

export const isValidEmail = (value: string): boolean =>
  EMAIL_PATTERN.test(value);

export const isValidPhone = (value: string): boolean => {
  const digits = digitCount(value);
  return (
    PHONE_CHARS.test(value) &&
    digits >= MIN_PHONE_DIGITS &&
    digits <= MAX_PHONE_DIGITS
  );
};

/**
 * Validate one field. Lengths are checked manually because the browser's
 * validity.tooShort does not fire for autofilled or script-set values.
 */
export function validateField(name: string, raw: string | boolean): string {
  const rule = FIELD_RULES[name];
  if (!rule) return '';
  if (rule.kind === 'checkbox')
    return raw === true || raw === 'true' ? '' : (rule.missing ?? '');
  const value = sanitize(String(raw ?? ''));
  if (!value)
    return rule.required
      ? (rule.missing ?? `Enter your ${rule.label.toLowerCase()}.`)
      : '';
  if (rule.kind === 'email' && !isValidEmail(value))
    return 'Enter an email address like name@example.com.';
  if (rule.kind === 'phone' && !isValidPhone(value))
    return `Enter a mobile number with ${MIN_PHONE_DIGITS} to ${MAX_PHONE_DIGITS} digits (spaces, +, - and brackets are fine).`;
  if (rule.min && value.length < rule.min)
    return `${rule.label} must be at least ${rule.min} characters.`;
  if (rule.max && value.length > rule.max)
    return `${rule.label} must be ${rule.max} characters or fewer.`;
  return '';
}

/** Validate the given fields in order; returns one error per invalid field. */
export const validateEnquiry = (
  values: FieldValues,
  names: readonly string[],
): FieldError[] =>
  names
    .map((name) => ({ name, message: validateField(name, values[name] ?? '') }))
    .filter((e) => e.message !== '');

const topicOf = (values: FieldValues): string =>
  sanitize(String(values.product || values.enquiry_type || 'Website enquiry'));

/** Email subject, e.g. "New enquiry from Asha Verma: DAYBONE". */
export const buildSubject = (values: FieldValues): string =>
  `New enquiry from ${sanitize(String(values.name ?? '')) || 'website visitor'}: ${topicOf(values)}`.slice(
    0,
    150,
  );

/** Submission time in the business's local time zone, e.g. "14 Oct 2026, 5:41 pm IST". */
export const formatSubmittedAt = (date: Date): string =>
  `${new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: BUSINESS_TIME_ZONE,
  }).format(date)} IST`;

/** Pre-filled WhatsApp text built from whatever the visitor has entered. */
export function buildWhatsAppText(values: FieldValues): string {
  const field = (key: string) => sanitize(String(values[key] ?? ''));
  const details = [
    ['Name', field('name')],
    ['Business', field('business')],
    ['City / state', field('city')],
    ['Product', field('product') || 'General / multiple products'],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`);
  return ['Hello DP Life Remedies,', '', ...details, '', field('message')]
    .join('\n')
    .trim();
}
