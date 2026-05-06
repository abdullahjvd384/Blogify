/**
 * JazzCash sandbox is a hosted-checkout flow: we POST a signed form from the
 * browser, the gateway handles the user's payment, then it redirects back to
 * our return URL. To trigger the POST without a navigation we'd otherwise
 * never make, build a hidden form, append it, and submit.
 */
export function submitToGateway(formUrl, fields) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = formUrl;
  form.style.display = 'none';

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value === null || value === undefined ? '' : String(value);
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
