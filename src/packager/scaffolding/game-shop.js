// The editor's game shop protocol: mistwarp-api asks Rotur for a payment
// request, the player approves it on rotur.dev, and mistwarp-api confirms it.
// An export isn't on MistWarp's own site, so Rotur can't message this page;
// it asks mistwarp-api until the payment is found or Rotur's window closes.
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const confirmWhilePaying = async (popup, confirm) => {
  for (;;) {
    const closed = popup.closed;
    try {
      return await confirm();
    } catch (e) {
      if (e.status !== 402) throw e;
      if (closed) throw new Error('You didn\'t finish paying on Rotur.');
    }
    await sleep(2000);
  }
};

export const openGameShop = async (projectId, productId, {request}) => {
  const path = `/projects/${encodeURIComponent(projectId)}/products`;
  const data = await request(path);
  const products = (data.products || []).filter(product => !productId || product.id === productId);
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;background:#000b;color:#eee;font:16px system-ui';
    const card = document.createElement('section');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'Game shop');
    card.style.cssText = 'background:#202027;padding:24px;border-radius:12px;max-height:80vh;overflow:auto;width:min(480px,85vw)';
    const title = document.createElement('h2');
    title.textContent = 'Game shop';
    const error = document.createElement('p');
    error.setAttribute('role', 'alert');
    const close = document.createElement('button');
    close.textContent = 'Cancel';
    const finish = result => { overlay.remove(); resolve(result); };
    close.onclick = () => finish({status: 'cancelled'});
    card.append(title);
    const buttons = [];
    for (const product of products) {
      const row = document.createElement('div');
      const description = document.createElement('p');
      description.textContent = `${product.name}: ${product.price} credits. ${product.description || ''}`;
      const buy = document.createElement('button');
      buy.textContent = product.owned ? 'Owned' : `Buy for ${product.price} credits`;
      buy.disabled = Boolean(product.owned);
      buttons.push(buy);
      buy.onclick = async () => {
        // Opened before anything is awaited, so the browser doesn't block it.
        const popup = window.open('', 'rotur-payment', 'popup,width=480,height=760');
        if (!popup) {
          error.textContent = 'Your browser blocked Rotur\'s payment window. Allow pop-ups, then try again.';
          return;
        }
        for (const button of buttons) button.disabled = true;
        close.disabled = true;
        error.textContent = '';
        try {
          const intent = await request(`${path}/${encodeURIComponent(product.id)}/purchase/intent`, 'POST', {});
          if (intent.already) {
            popup.close();
            return finish({status: 'owned', product: intent.product});
          }
          if (Number(intent.amount) !== Number(product.price)) throw new Error('The price changed. Reopen the shop to review it.');
          popup.location.href = intent.approveUrl;
          const confirmed = await confirmWhilePaying(popup, () =>
            request(`${path}/${encodeURIComponent(product.id)}/purchase/confirm`, 'POST', {key: intent.key}));
          popup.close();
          finish({status: 'purchased', product: confirmed.product});
        } catch (e) {
          popup.close();
          error.textContent = e.message;
          products.forEach((item, index) => { buttons[index].disabled = Boolean(item.owned); });
          close.disabled = false;
        }
      };
      row.append(description, buy);
      card.append(row);
    }
    if (!products.length) {
      const empty = document.createElement('p');
      empty.textContent = 'This project has no matching products.';
      card.append(empty);
    }
    card.append(error, close);
    overlay.append(card);
    document.body.append(overlay);
  });
};
