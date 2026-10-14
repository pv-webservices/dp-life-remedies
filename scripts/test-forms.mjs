// Browser tests for the enquiry forms against the built site (`npm run preview` on port 4321).
// SAFETY: every request to formsubmit.co is intercepted and answered with a mock — nothing is
// ever sent to FormSubmit or Gmail. Any unmocked FormSubmit request fails the run.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const origin = process.env.QA_URL || 'http://127.0.0.1:4321';
const AJAX = 'https://formsubmit.co/ajax/dpliferemedies@gmail.com';
const POST = 'https://formsubmit.co/dpliferemedies@gmail.com';
const browser = await chromium.launch();
const results = [];
const errors = [];

/** New page with FormSubmit fully mocked. `respond` decides each AJAX reply. */
async function setup({ respond = null, js = true, path = '/contact/' } = {}) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    javaScriptEnabled: js,
    reducedMotion: 'reduce',
  });
  const requests = [];
  await context.route('https://formsubmit.co/**', async (route) => {
    const req = route.request();
    requests.push({
      url: req.url(),
      method: req.method(),
      body: req.postData(),
    });
    if (req.url() === AJAX && respond) return respond(route);
    if (req.url() === POST && !js)
      // Simulate FormSubmit's redirect to the _next page.
      return route.fulfill({
        status: 302,
        headers: { location: `${origin}/thank-you/` },
      });
    return route.abort('blockedbyclient');
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`${page.url()}: ${e.message}`));
  if (js) {
    await page.addInitScript(() => {
      window.__opened = [];
      window.open = (url) => {
        window.__opened.push(String(url));
        return null;
      };
    });
    await page.clock.install();
  }
  await page.goto(origin + path, { waitUntil: 'networkidle' });
  const form = page.locator('#enquiry form[data-enquiry]');
  return { context, page, form, requests };
}

const fillValid = async (form) => {
  await form.locator('[name="name"]').fill('QA Tester');
  await form.locator('[name="phone"]').fill('+91 98765 43210');
  await form.locator('[name="email"]').fill('qa@example.com');
  await form
    .locator('[name="message"]')
    .fill('Synthetic test enquiry — please ignore.');
  await form.locator('[name="consent"]').check();
};
const passBotTimer = (page) => page.clock.fastForward(4000);
const alertText = (form) => form.locator('[data-form-alert]').innerText();
const ok = (name) => results.push(name);

try {
  // 1. Empty submit: field errors, summary, focus on first invalid field, nothing sent.
  {
    const { context, page, form, requests } = await setup();
    await passBotTimer(page);
    await form.locator('[data-submit]').click();
    for (const name of ['name', 'phone', 'email', 'message', 'consent']) {
      const field = form.locator(`[name="${name}"]`);
      assert.equal(
        await field.getAttribute('aria-invalid'),
        'true',
        `${name} invalid`,
      );
      const errorId = (await field.getAttribute('aria-describedby'))
        .split(' ')
        .pop();
      assert.ok(
        (await page.locator(`#${errorId}`).innerText()).length > 5,
        `${name} message`,
      );
    }
    assert.match(await alertText(form), /5 fields need attention/);
    assert.equal(await form.locator('[data-form-alert] li a').count(), 5);
    assert.equal(
      await page.evaluate(() => document.activeElement.name),
      'name',
    );
    assert.equal(requests.length, 0);
    await context.close();
    ok(
      'empty submit: 5 linked field errors, summary, focus first invalid, nothing sent',
    );
  }

  // 2. Format, manual min-length (script-filled values) and max-length rules.
  {
    const { context, page, form, requests } = await setup();
    await passBotTimer(page);
    await fillValid(form);
    await form.locator('[name="email"]').fill('qa@example');
    await form.locator('[name="phone"]').fill('12345');
    // Set via script, as autofill does: validity.tooShort would not fire for this.
    await form
      .locator('[name="message"]')
      .evaluate((el) => (el.value = 'short'));
    await form.locator('[data-submit]').click();
    assert.match(
      await page.locator('#contact-email-error').innerText(),
      /name@example\.com/,
    );
    assert.match(
      await page.locator('#contact-phone-error').innerText(),
      /10 to 15 digits/,
    );
    assert.match(
      await page.locator('#contact-message-error').innerText(),
      /at least 10/,
    );
    assert.equal(
      await page.evaluate(() => document.activeElement.name),
      'phone',
    );
    await form
      .locator('[name="message"]')
      .evaluate((el) => (el.value = 'x'.repeat(2100)));
    await form.locator('[data-submit]').click();
    assert.match(
      await page.locator('#contact-message-error').innerText(),
      /2000 characters or fewer/,
    );
    assert.equal(requests.length, 0);
    await context.close();
    ok('validation: email format, phone digits, manual min/max length');
  }

  // 3. Consent is required on its own.
  {
    const { context, page, form, requests } = await setup();
    await passBotTimer(page);
    await fillValid(form);
    await form.locator('[name="consent"]').uncheck();
    await form.locator('[data-submit]').click();
    assert.match(
      await page.locator('#contact-consent-error').innerText(),
      /Privacy Policy/,
    );
    assert.match(await alertText(form), /1 field needs attention/);
    assert.equal(requests.length, 0);
    await context.close();
    ok('consent required');
  }

  // 4. Successful send: payload, busy state, redirect to /thank-you/, draft cleared.
  {
    let release;
    const gate = new Promise((r) => (release = r));
    const { context, page, form, requests } = await setup({
      path: '/products/daybone/',
      respond: async (route) => {
        await gate;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: 'true',
            message: 'The form was submitted successfully.',
          }),
        });
      },
    });
    await passBotTimer(page);
    await fillValid(form);
    await form.locator('[data-submit]').click();
    await page.waitForFunction(
      () =>
        document.querySelector('#enquiry form').getAttribute('aria-busy') ===
        'true',
    );
    assert.ok(
      await form.locator('[data-submit]').isDisabled(),
      'submit disabled while sending',
    );
    assert.ok(
      await form.locator('[data-whatsapp]').isDisabled(),
      'WhatsApp disabled while sending',
    );
    assert.equal(
      await form.locator('[data-submit-label]').innerText(),
      'Sending…',
    );
    release();
    await page.waitForURL('**/thank-you/');
    const body = JSON.parse(requests[0].body);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, 'POST');
    assert.equal(body._subject, 'New enquiry from QA Tester: DAYBONE');
    assert.equal(
      body.email,
      'qa@example.com',
      'visitor email (FormSubmit Reply-To)',
    );
    assert.equal(body.product, 'DAYBONE');
    assert.equal(body.form_type, 'Product page enquiry');
    assert.equal(body.page_url, `${origin}/products/daybone/`);
    assert.match(body.submitted_at, /IST$/);
    assert.equal(body._captcha, 'false');
    assert.equal(body._template, 'table');
    assert.equal(body._honey, '');
    assert.ok(body.consent.startsWith('Yes'));
    assert.equal(body._next, undefined);
    const drafts = await page.evaluate(() =>
      Object.keys(sessionStorage).filter((k) => k.startsWith('dp-enquiry:')),
    );
    assert.deepEqual(drafts, [], 'draft cleared after send');
    assert.equal(
      await page.locator('meta[name="robots"]').getAttribute('content'),
      'noindex, follow',
    );
    assert.equal(await page.locator('link[rel="canonical"]').count(), 0);
    await context.close();
    ok(
      'success: correct payload & subject, buttons disabled while sending, redirect to /thank-you/',
    );
  }

  // 5. Honeypot: pretend success, send nothing.
  {
    const { context, page, form, requests } = await setup();
    await passBotTimer(page);
    await fillValid(form);
    await form
      .locator('[name="_honey"]')
      .evaluate((el) => (el.value = 'http://spam.example'));
    await form.locator('[data-submit]').click();
    await page.waitForURL('**/thank-you/');
    assert.equal(requests.length, 0);
    await context.close();
    ok('honeypot: bot sees thank-you page, nothing sent');
  }

  // 6. Bot timer: an instant submit is held back.
  {
    const { context, form, requests } = await setup();
    await fillValid(form);
    await form.locator('[data-submit]').click();
    assert.match(await alertText(form), /take a moment/);
    assert.equal(requests.length, 0);
    await context.close();
    ok('bot timer: submit within 3 s is not sent');
  }

  // 7. Delivery failure (e.g. FormSubmit error or form not yet activated): alternatives offered, data kept.
  {
    const { context, page, form } = await setup({
      respond: (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: 'false',
            message: 'This form needs Activation.',
          }),
        }),
    });
    await passBotTimer(page);
    await fillValid(form);
    await form.locator('[data-submit]').click();
    await form.locator('[data-form-alert]:not([hidden])').waitFor();
    const text = await alertText(form);
    assert.match(text, /could not be delivered/);
    assert.equal(
      await form.locator('.alert-actions a[href^="tel:+917900001029"]').count(),
      1,
    );
    assert.equal(
      await form
        .locator('.alert-actions a[href^="https://wa.me/917900001029"]')
        .count(),
      1,
    );
    assert.equal(
      await form
        .locator('.alert-actions a[href^="mailto:dpliferemedies@gmail.com"]')
        .count(),
      1,
    );
    assert.equal(
      await form.locator('[name="message"]').inputValue(),
      'Synthetic test enquiry — please ignore.',
    );
    assert.ok(await form.locator('[name="consent"]').isChecked());
    assert.ok(
      await form.locator('[data-submit]').isEnabled(),
      'buttons re-enabled',
    );
    assert.equal(
      await page.evaluate(() =>
        document.activeElement.hasAttribute('data-form-alert'),
      ),
      true,
    );
    assert.ok(page.url().endsWith('/contact/'));
    await context.close();
    ok(
      'delivery failure: message with call/WhatsApp/email, data kept, buttons re-enabled',
    );
  }

  // 8. Network failure.
  {
    const { context, page, form } = await setup({
      respond: (route) => route.abort('connectionreset'),
    });
    await passBotTimer(page);
    await fillValid(form);
    await form.locator('[data-submit]').click();
    await form.locator('[data-form-alert]:not([hidden])').waitFor();
    assert.match(await alertText(form), /could not be delivered/);
    assert.equal(await form.locator('[name="name"]').inputValue(), 'QA Tester');
    await context.close();
    ok('network failure: delivery-failure message, data kept');
  }

  // 9. Offline: nothing is attempted.
  {
    const { context, page, form, requests } = await setup({
      respond: (route) => route.abort(),
    });
    await passBotTimer(page);
    await fillValid(form);
    await context.setOffline(true);
    await form.locator('[data-submit]').click();
    assert.match(await alertText(form), /offline/);
    assert.equal(requests.length, 0);
    assert.equal(
      await form.locator('[name="email"]').inputValue(),
      'qa@example.com',
    );
    await context.close();
    ok('offline: offline message, nothing sent, data kept');
  }

  // 10. Timeout after ~20 s with no response.
  {
    const { context, page, form } = await setup({
      respond: () => new Promise(() => {}),
    });
    await passBotTimer(page);
    await fillValid(form);
    await form.locator('[data-submit]').click();
    await page.waitForFunction(
      () =>
        document.querySelector('#enquiry form').getAttribute('aria-busy') ===
        'true',
    );
    await page.clock.fastForward(19_000);
    assert.equal(
      await form.getAttribute('aria-busy'),
      'true',
      'still waiting at 19 s',
    );
    await page.clock.fastForward(2_000);
    await form.locator('[data-form-alert]:not([hidden])').waitFor();
    assert.match(await alertText(form), /taking longer than expected/);
    assert.ok(await form.locator('[data-submit]').isEnabled());
    await context.close();
    ok('timeout: request aborted at 20 s, timeout message, buttons re-enabled');
  }

  // 11. Back button (bfcache restore) re-enables the buttons.
  {
    const { context, page, form } = await setup();
    await page.evaluate(() => {
      document
        .querySelectorAll('#enquiry form button')
        .forEach((b) => (b.disabled = true));
      window.dispatchEvent(
        new PageTransitionEvent('pageshow', { persisted: true }),
      );
    });
    assert.ok(await form.locator('[data-submit]').isEnabled());
    await context.close();
    ok('pageshow (Back button): buttons re-enabled');
  }

  // 12. Entered data survives a reload (sessionStorage draft).
  {
    const { context, page, form } = await setup();
    await form.locator('[name="name"]').fill('Draft Person');
    await form
      .locator('[name="message"]')
      .fill('Draft message kept across reloads.');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(
      await form.locator('[name="name"]').inputValue(),
      'Draft Person',
    );
    assert.equal(
      await form.locator('[name="message"]').inputValue(),
      'Draft message kept across reloads.',
    );
    await context.close();
    ok('draft restored after reload');
  }

  // 13. Send via WhatsApp: pre-filled, exempt from the bot timer, no FormSubmit request.
  {
    const { context, page, form, requests } = await setup({
      path: '/products/dp-q10/',
    });
    await form.locator('[name="name"]').fill('QA Tester');
    await form.locator('[name="message"]').fill('Need DP-Q10 pack details.');
    await form.locator('[data-whatsapp]').click(); // immediately: no bot timer
    const opened = await page.evaluate(() => window.__opened);
    assert.equal(opened.length, 1);
    const url = new URL(opened[0]);
    assert.equal(url.origin + url.pathname, 'https://wa.me/917900001029');
    const text = url.searchParams.get('text');
    assert.match(text, /Name: QA Tester/);
    assert.match(text, /Product: DP-Q10/);
    assert.match(text, /Need DP-Q10 pack details\./);
    assert.equal(requests.length, 0);
    await context.close();
    ok(
      'WhatsApp: pre-filled message, no bot timer, nothing sent to FormSubmit',
    );
  }

  // 14. Quick (compact) form on the explorer also collects email and consent.
  {
    const { context, page, requests } = await setup({
      path: '/product-divisions/syrups/',
    });
    const quick = page.locator('#quick-enquiry form');
    for (const name of ['name', 'phone', 'email', 'message', 'consent'])
      assert.equal(
        await quick.locator(`[name="${name}"]`).count(),
        1,
        `quick form has ${name}`,
      );
    await passBotTimer(page);
    await quick.locator('[data-submit]').click();
    assert.match(
      await quick.locator('[data-form-alert]').innerText(),
      /5 fields need attention/,
    );
    assert.equal(requests.length, 0);
    await context.close();
    ok('quick enquiry form: same required fields and validation');
  }

  // 15. Regression: correcting errors on a phone must not shift the layout under the next tap.
  {
    const { context, page, form, requests } = await setup();
    await page.setViewportSize({ width: 375, height: 800 });
    await passBotTimer(page);
    await form.locator('[data-submit]').click();
    await fillValid(form); // fills fields, then taps the consent checkbox
    assert.ok(
      await form.locator('[name="consent"]').isChecked(),
      'consent toggles on first tap',
    );
    assert.equal(
      await form.locator('.field-error:not(:empty)').count(),
      0,
      'errors clear as fields are fixed',
    );
    assert.equal(requests.length, 0);
    await context.close();
    ok('mobile: errors clear while typing, no layout shift under the next tap');
  }

  // 16. JavaScript disabled: native validation, then a normal POST to FormSubmit → /thank-you/.
  {
    const { context, page, form, requests } = await setup({ js: false });
    assert.ok(
      await form.locator('[data-whatsapp]').isHidden(),
      'WhatsApp button hidden without JS',
    );
    await form.locator('[data-submit]').click();
    assert.equal(requests.length, 0, 'native validation blocks an empty form');
    await fillValid(form);
    await Promise.all([
      page.waitForURL('**/thank-you/'),
      form.locator('[data-submit]').click(),
    ]);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, POST);
    const body = new URLSearchParams(requests[0].body);
    assert.equal(body.get('_next'), 'https://dpliferemedies.com/thank-you/');
    assert.equal(body.get('_captcha'), 'false');
    assert.equal(body.get('name'), 'QA Tester');
    assert.equal(body.get('email'), 'qa@example.com');
    assert.equal(body.get('form_type'), 'Contact page enquiry');
    assert.equal(body.get('page_url'), 'https://dpliferemedies.com/contact/');
    assert.ok(body.get('_subject'));
    await context.close();
    ok(
      'no-JS fallback: native validation, POST to FormSubmit with _next=/thank-you/',
    );
  }

  assert.deepEqual(errors, [], 'page errors');
} finally {
  await browser.close();
}
results.forEach((r, i) => console.log(`✔ ${i + 1}. ${r}`));
console.log(`Form tests: ${results.length} passed, 0 real submissions.`);
