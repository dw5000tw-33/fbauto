'use strict';

const WORKS_REQUEST = '33works-marketplace-extension';
const WORKS_RESPONSE = '33works-marketplace-page';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function dataUrlToFile(dataUrl, name) {
  const [head, body] = String(dataUrl).split(',');
  const type = head.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
  const binary = atob(body);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return new File([bytes], name, {type});
}

function photoCount() {
  const match = document.body.innerText.match(/相片\s*·\s*(\d+)\s*[／/]\s*10/);
  return match ? Number(match[1]) : 0;
}

function uploaderScore(input) {
  const accept = String(input.accept || '').toLowerCase();
  return (input.multiple ? 10 : 0) + (accept.includes('image') ? 5 : 0) - (input.hasAttribute('capture') ? 20 : 0);
}

window.addEventListener('message', async event => {
  const message = event.data;
  if (event.source !== window || message?.source !== WORKS_REQUEST || message.type !== 'UPLOAD_PHOTOS') return;
  const response = {source: WORKS_RESPONSE, requestId: message.requestId, ok: false};
  try {
    if (!location.pathname.startsWith('/marketplace/create/item')) throw new Error('目前不是 Marketplace 出售商品頁。');
    const photos = Array.isArray(message.photos) ? message.photos.slice(0, 10) : [];
    if (!photos.length) throw new Error('排程沒有可上傳的照片。');
    const scope = document.querySelector('[role="main"]') || document;
    const uploaders = [...scope.querySelectorAll('input[type="file"]')]
      .filter(input => /image/i.test(String(input.accept || '')))
      .sort((a, b) => uploaderScore(b) - uploaderScore(a));
    const input = uploaders[0];
    if (!input) throw new Error('找不到 Facebook 照片上傳欄。');
    const transfer = new DataTransfer();
    photos.forEach(photo => transfer.items.add(dataUrlToFile(photo.dataUrl, photo.name)));
    input.files = transfer.files;
    input.dispatchEvent(new Event('input', {bubbles: true, composed: true}));
    input.dispatchEvent(new Event('change', {bubbles: true, composed: true}));
    await sleep(1800);
    response.ok = true;
    response.assigned = input.files?.length || 0;
    response.rendered = photoCount();
  } catch (error) {
    response.error = error.message;
  }
  window.postMessage(response, '*');
});
