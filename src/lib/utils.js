export const DOC_TYPE_LABELS = { invoice:'請求書', receipt:'領収書', estimate:'見積書' };

export const calcTax = items => {
  let subtotal=0, taxAmount=0;
  items.forEach(item => {
    const lineTotal = item.quantity * item.unitPrice;
    if (item.taxType === 'inclusive') {
      const r = item.taxRate/100;
      const excl = Math.floor(lineTotal/(1+r));
      subtotal += excl; taxAmount += lineTotal - excl;
    } else { subtotal += lineTotal; taxAmount += Math.floor(lineTotal * item.taxRate/100); }
  });
  return { subtotal, taxAmount, total: subtotal+taxAmount };
};

export const formatCurrency = a => `¥${Math.round(a).toLocaleString('ja-JP')}`;
export const formatDate = s => { if(!s) return ''; const d=new Date(s); return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`; };

// 数値フォーマット用ヘルパー
export const toComma = n => n === 0 ? '' : n.toLocaleString('ja-JP');
export const fromComma = s => { const n = parseInt(s.replace(/,/g,'').replace(/[^0-9]/g,'')); return isNaN(n) ? 0 : n; };
export const toQtyStr = n => n === 0 ? '' : String(n);
export const fromQty = s => { const n = parseFloat(s.replace(/,/g,'')); return isNaN(n) ? 0 : n; };

export const getLocalDate = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

// 全角→半角変換
export const toHankaku = s => s.replace(/[\uFF21-\uFF3A\uFF41-\uFF5A\uFF10-\uFF19]/g, c => String.fromCharCode(c.charCodeAt(0) - 65248)).replace(/\u3000/g,' ');

// 電話番号自動フォーマット（日本の市外局番ルール準拠）
export const formatPhone = raw => {
  let s = toHankaku(raw).replace(/[^\d]/g,'');
  if (s.length === 0) return '';
  if (s.length === 9 && !s.startsWith('0')) s = '0' + s;
  if (/^(0120|0800)/.test(s)) {
    if (s.length <= 4) return s;
    if (s.length <= 7) return s.slice(0,4)+'-'+s.slice(4);
    return s.slice(0,4)+'-'+s.slice(4,7)+'-'+s.slice(7);
  }
  if (/^(090|080|070|050)/.test(s)) {
    if (s.length <= 3) return s;
    if (s.length <= 7) return s.slice(0,3)+'-'+s.slice(3);
    return s.slice(0,3)+'-'+s.slice(3,7)+'-'+s.slice(7,11);
  }
  if (/^0[36]\d/.test(s)) {
    if (s.length <= 2) return s;
    if (s.length <= 6) return s.slice(0,2)+'-'+s.slice(2);
    return s.slice(0,2)+'-'+s.slice(2,6)+'-'+s.slice(6,10);
  }
  if (/^(011|015|017|018|019|022|023|024|025|026|027|028|029|042|043|044|045|046|047|048|049|052|053|054|055|058|059|072|073|075|076|077|078|079|082|083|084|086|087|088|089|092|093|095|096|097|098|099)\d/.test(s)) {
    if (s.length <= 3) return s;
    if (s.length <= 6) return s.slice(0,3)+'-'+s.slice(3);
    return s.slice(0,3)+'-'+s.slice(3,6)+'-'+s.slice(6,10);
  }
  if (s.startsWith('0')) {
    if (s.length <= 4) return s;
    if (s.length <= 6) return s.slice(0,4)+'-'+s.slice(4);
    return s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,10);
  }
  return s;
};

// 郵便番号から住所検索
export const lookupPostal = (digits, onResult, onError) => {
  fetch('https://zipcloud.ibsnet.co.jp/api/search?zipcode=' + digits)
    .then(r => r.json())
    .then(data => {
      if (data.results && data.results[0]) {
        const r = data.results[0];
        onResult(r.address1 + r.address2 + r.address3);
      } else { onError(); }
    })
    .catch(onError);
};

// 画像処理：黒背景除去＋リサイズ
export const processImage = (file, isStamp, callback) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    let w, h;
    if (isStamp) {
      w = h = 400;
    } else {
      const maxW = 600;
      const scale = Math.min(1, maxW / img.width);
      w = Math.round(img.width * scale);
      h = Math.round(img.height * scale);
    }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] < 40 && d[i+1] < 40 && d[i+2] < 40) {
        d[i+3] = 0;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    callback(canvas.toDataURL('image/png'));
    URL.revokeObjectURL(url);
  };
  img.onerror = () => { URL.revokeObjectURL(url); };
  img.src = url;
};
