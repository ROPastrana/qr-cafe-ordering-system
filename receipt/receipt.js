// E-receipt page: loads a paid order with its secret receipt token and draws it.
// Kept out of index.html so the Content-Security-Policy can forbid inline scripts.
// Code 39 patterns: 9 elements per character (bar, space, bar...), 1 = wide, 0 = narrow
const CODE39 = {
  '0':'000110100','1':'100100001','2':'001100001','3':'101100000','4':'000110001',
  '5':'100110000','6':'001110000','7':'000100101','8':'100100100','9':'001100100',
  'A':'100001001','B':'001001001','C':'101001000','D':'000011001','E':'100011000',
  'F':'001011000','G':'000001101','H':'100001100','I':'001001100','J':'000011100',
  'K':'100000011','L':'001000011','M':'101000010','N':'000010011','O':'100010010',
  'P':'001010010','Q':'000000111','R':'100000110','S':'001000110','T':'000010110',
  'U':'110000001','V':'011000001','W':'111000000','X':'010010001','Y':'110010000',
  'Z':'011010000','-':'010000101','.':'110000100',' ':'011000100','*':'010010100'
};

function barcodeSvg(text) {
  const chars = ['*', ...text.toUpperCase().split(''), '*'];
  const narrow = 2, wide = 5;
  let x = 0;
  const bars = [];
  for (const ch of chars) {
    const pat = CODE39[ch];
    if (!pat) return null;                       // character can't be encoded
    for (let i = 0; i < 9; i++) {
      const w = pat[i] === '1' ? wide : narrow;
      if (i % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${w}" height="50"/>`);
      x += w;
    }
    x += narrow;                                 // gap between characters
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x} 50" preserveAspectRatio="none" fill="#1C1C1C">${bars.join('')}</svg>`;
}

const app = document.getElementById('app');
const peso = (n) => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;     // textContent only: customer names can't inject HTML
  return e;
}
function row(label, value, cls) {
  const r = el('div', 'row');
  r.append(el('span', 'muted', label), el('span', cls || '', value));
  return r;
}

function render(d) {
  document.title = d.receiptNumber + ' - QR Cafe';
  const head = el('div', 'head');
  head.append(el('h1', '', 'QR CAFÉ'), el('p', '', 'OFFICIAL E-RECEIPT'));

  const body = el('div', 'body');
  const when = new Date(d.date);
  const grid = el('div', 'grid');
  [
    ['Receipt No.', d.receiptNumber],
    ['Order No.', '#' + d.orderCode],
    ['Date', when.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })],
    ['Time', when.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })],
    ['Customer', d.customer],
    ['Type', d.type],
  ].forEach(([label, value]) => {
    const cell = el('div');
    cell.append(el('p', 'label', label), el('p', 'value', value));
    grid.append(cell);
  });
  body.append(grid, el('hr'), el('p', 'label', 'Items'));

  d.items.forEach((i) => {
    const line = el('div', 'item');
    const left = el('div');
    left.append(el('strong', '', i.name));
    if (i.variant) left.append(el('small', '', i.variant));
    const right = el('div');
    right.style.textAlign = 'right';
    right.append(el('small', '', `${i.qty} × ${peso(i.unitPrice)}`), el('strong', '', peso(i.lineTotal)));
    line.append(left, right);
    body.append(line);
  });

  body.append(el('hr'), row('Subtotal', peso(d.subtotal)));
  if (d.discountLabel) body.append(row(d.discountLabel + ' Discount (20%)', '−' + peso(d.discount), 'green'));
  const totalRow = row('TOTAL', peso(d.total), 'total');
  totalRow.style.fontSize = '15px';
  body.append(totalRow, row('Payment Method', d.method === 'gcash' ? 'GCash / QR' : 'Cash'));
  if (d.method === 'gcash' && d.gcashRef) body.append(row('GCash Ref. No.', d.gcashRef));
  if (d.method === 'cash') body.append(row('Cash Tendered', peso(d.amountPaid)), row('Change', peso(d.change), 'green'));

  const svg = barcodeSvg(d.receiptNumber);
  if (svg) {
    const bc = el('div', 'barcode');
    bc.innerHTML = svg;     // safe: built only from characters validated against CODE39
    bc.append(el('p', '', d.receiptNumber));
    body.append(bc);
  }
  body.append(el('p', 'thanks', 'Thank you for visiting QR Café! Please keep this receipt for your records.'));

  app.replaceChildren(head, body);
}

const token = new URLSearchParams(location.search).get('t') || '';
fetch('/cafe/api/receipt.php?t=' + encodeURIComponent(token))
  .then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Receipt not found');
    return data;
  })
  .then(render)
  .catch((e) => app.replaceChildren(el('p', 'msg err', e.message)));

document.getElementById('print-btn').addEventListener('click', () => window.print());
