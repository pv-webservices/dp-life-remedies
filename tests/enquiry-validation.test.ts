import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FIELD_RULES,
  buildSubject,
  buildWhatsAppText,
  digitCount,
  formatSubmittedAt,
  isValidEmail,
  isValidPhone,
  sanitize,
  validateEnquiry,
  validateField,
} from '../src/scripts/modules/enquiry-validation.ts';

const REQUIRED = ['name', 'phone', 'email', 'message', 'consent'];
const valid = {
  name: 'Asha Verma',
  phone: '+91 98765 43210',
  email: 'asha@example.in',
  message: 'Need DAYBONE pack details for our pharmacy.',
  consent: true,
};

test('a complete enquiry has no errors', () => {
  assert.deepEqual(validateEnquiry(valid, REQUIRED), []);
});

test('every required field is reported when the form is empty', () => {
  const errors = validateEnquiry({}, REQUIRED);
  assert.deepEqual(
    errors.map((e) => e.name),
    REQUIRED,
  );
  assert.equal(errors[0].message, 'Enter your full name.');
});

test('consent must be explicitly true', () => {
  assert.match(validateField('consent', false), /Privacy Policy/);
  assert.match(validateField('consent', ''), /Privacy Policy/);
  assert.equal(validateField('consent', true), '');
});

test('email format is checked', () => {
  for (const bad of [
    'asha',
    'asha@',
    'asha@example',
    'a b@example.com',
    'asha@example.c',
  ])
    assert.equal(isValidEmail(bad), false, bad);
  for (const good of ['asha@example.in', 'a.b+trade@clinic.co.in'])
    assert.equal(isValidEmail(good), true, good);
  assert.match(validateField('email', 'asha@'), /name@example\.com/);
});

test('phone needs 10–15 digits and only phone characters', () => {
  assert.equal(digitCount('+91 (98765) 43-210'), 12);
  assert.equal(isValidPhone('987654321'), false); // 9 digits
  assert.equal(isValidPhone('9876543210'), true); // 10 digits
  assert.equal(isValidPhone('+91 98765 43210'), true);
  assert.equal(isValidPhone('1234567890123456'), false); // 16 digits
  assert.equal(isValidPhone('98765abc43210'), false);
});

test('minimum lengths are enforced manually (autofill-safe)', () => {
  assert.match(validateField('name', 'A'), /at least 2/);
  assert.match(validateField('message', 'Too short'), /at least 10/);
  assert.equal(validateField('message', '  Ten chars!  '), '');
});

test('maximum lengths are enforced', () => {
  assert.match(
    validateField('name', 'x'.repeat(101)),
    /100 characters or fewer/,
  );
  assert.match(
    validateField('message', 'x'.repeat(2001)),
    /2000 characters or fewer/,
  );
  assert.equal(validateField('message', 'x'.repeat(2000)), '');
});

test('optional fields may be empty but are length-checked when filled', () => {
  assert.equal(FIELD_RULES.business.required, false);
  assert.equal(validateField('business', ''), '');
  assert.match(validateField('business', 'A'), /at least 2/);
});

test('whitespace-only input counts as empty', () => {
  assert.equal(validateField('name', '   '), 'Enter your full name.');
});

test('sanitize trims and strips control characters', () => {
  assert.equal(sanitize('  Asha\u0000 Verma\u0007 '), 'Asha Verma');
  assert.equal(sanitize('Line 1\nLine 2'), 'Line 1\nLine 2');
});

test('subject names the visitor and the topic', () => {
  assert.equal(
    buildSubject({ name: 'Asha Verma', product: 'DAYBONE' }),
    'New enquiry from Asha Verma: DAYBONE',
  );
  assert.equal(
    buildSubject({ name: 'Asha', enquiry_type: 'Trade partnership' }),
    'New enquiry from Asha: Trade partnership',
  );
  assert.equal(
    buildSubject({ name: '' }),
    'New enquiry from website visitor: Website enquiry',
  );
  assert.ok(buildSubject({ name: 'x'.repeat(300) }).length <= 150);
});

test('submission time is formatted in India Standard Time', () => {
  const text = formatSubmittedAt(new Date('2026-10-14T12:11:00Z'));
  assert.match(text, /14 Oct 2026/);
  assert.match(text, /5:41\s?pm IST$/i);
});

test('WhatsApp text includes the entered details and skips empty ones', () => {
  const text = buildWhatsAppText({
    name: 'Asha',
    product: '',
    message: 'Pack sizes please',
  });
  assert.equal(
    text,
    'Hello DP Life Remedies,\n\nName: Asha\nProduct: General / multiple products\n\nPack sizes please',
  );
  assert.ok(!text.includes('Business:'));
});
