// The same intent/payment/confirmation protocol used by the editor's game shop.
export const openGameShop = async (projectId, productId, {request, ensureConsent, client}) => {
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
      let intent;
      let payment;
      const key = `mistwarp:game_product:${projectId}:${product.id}:${crypto.randomUUID()}`;
      buy.onclick = async () => {
        for (const button of buttons) button.disabled = true;
        close.disabled = true;
        error.textContent = '';
        try {
          intent = intent || await request(`${path}/${encodeURIComponent(product.id)}/purchase/intent`, 'POST');
          if (intent.already) return finish({status: 'owned', product: intent.product});
          if (Number(intent.amount) !== Number(product.price)) throw new Error('The price changed. Reopen the shop to review it.');
          if (!payment) {
            await ensureConsent(['credits:transfer']);
            const response = await fetch('https://api.rotur.dev/v2/commerce/payments', {
              method: 'POST',
              headers: {Authorization: `Bearer ${client.token}`, 'Content-Type': 'application/json'},
              body: JSON.stringify({amount: intent.amount, source: 'mistwarp', kind: 'game_product',
                resource_type: 'game_product', resource_id: intent.resourceId,
                note: `MistWarp game item: ${intent.title || product.id}`, splits: intent.splits, idempotency_key: key})
            });
            const result = await response.json();
            if (!response.ok || !result.payment) throw new Error(result.error || 'Payment failed');
            payment = result.payment;
          }
          const confirmed = await request(`${path}/${encodeURIComponent(product.id)}/purchase/confirm`, 'POST',
            {key: intent.key, paymentId: payment.id});
          finish({status: 'purchased', product: confirmed.product});
        } catch (e) {
          error.textContent = payment ? `Payment sent. ${e.message}. Retry to check this payment again.` : e.message;
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
