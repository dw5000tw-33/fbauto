/*!
 * 刪文助手（公開版空殼）
 * 說明：此檔不再提供核心功能。請加入官方 LINE 取得授權後使用 loader 流程。
 */
(() => {
  const EXPIRES = Date.parse('2025-09-05T00:00:00+08:00'); // 可自行調整
  const msg = [
    '此版本僅為提示：核心已搬家 🚚',
    '請加入官方 LINE（@307momvl），輸入「臉書刪文」取得檢核碼，再從面板啟動。',
    '（若你是看到舊教學的連結，請更新教學連結）'
  ].join('\n');

  try {
    if (Date.now() > EXPIRES) {
      alert('版本已過期，請加入官方 LINE 重新取得授權。');
      return;
    }
    alert(msg);
  } catch {}
  console.warn('[刪文助手] 公開版已停用：請透過新版面板 + 檢核碼啟動。');
})();
