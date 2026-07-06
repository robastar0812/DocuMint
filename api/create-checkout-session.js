const Stripe = require('stripe');

// === セキュリティ修正: リダイレクト先を許可ドメインに限定（Origin/Refererヘッダ偽装対策） ===
function resolveBaseUrl(req, allowedOrigin) {
  const rawOrigin = req.headers.origin || req.headers.referer || '';
  try {
    const u = new URL(rawOrigin);
    const origin = `${u.protocol}//${u.host}`;
    // 本番ドメイン・Vercelプレビュー(staging等)・ローカル開発のみ許可
    if (origin === allowedOrigin || u.hostname.endsWith('.vercel.app') || u.hostname === 'localhost') {
      return origin;
    }
  } catch (e) { /* Origin無し・不正URL → フォールバック */ }
  return allowedOrigin;
}

module.exports = async function handler(req, res) {
  // CORS対応（修正: 自ドメインに制限）
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://docu-mint-two.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const priceId = process.env.STRIPE_PRICE_ID;

    // リクエストボディからメールアドレスを取得（追加）
    const { email } = req.body || {};

    // リダイレクト先（修正: 許可ドメインのみ）
    const baseUrl = resolveBaseUrl(req, allowedOrigin);

    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // 決済成功後のリダイレクト先
      success_url: baseUrl + '?checkout=success&session_id={CHECKOUT_SESSION_ID}',
      // キャンセル時のリダイレクト先
      cancel_url: baseUrl + '?checkout=cancel',
      // 日本語ロケール
      locale: 'ja',
    };

    // ログイン済みユーザーのメールを紐付け（追加）
    if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
