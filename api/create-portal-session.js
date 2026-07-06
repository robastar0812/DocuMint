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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // === セキュリティ修正: メールをリクエストボディではなくSupabase認証トークンから取得 ===
    // （旧: body.email を無検証で使用 → 他人のメールを送るだけで他人のポータルを開けた）
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return res.status(401).json({ error: 'ログインが必要です' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'サーバー設定エラー' });
    }

    // Supabaseにトークンを照合して本人のメールアドレスを取得
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${token}` },
    });
    if (!userRes.ok) {
      return res.status(401).json({ error: '認証に失敗しました。再ログインしてください' });
    }
    const authUser = await userRes.json();
    const email = authUser && authUser.email;
    if (!email) {
      return res.status(401).json({ error: '認証に失敗しました。再ログインしてください' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // メールアドレスからStripe顧客を検索
    const customers = await stripe.customers.list({ email: email, limit: 1 });

    if (customers.data.length === 0) {
      return res.status(404).json({ error: '有料プランの登録が見つかりません' });
    }

    const customerId = customers.data[0].id;

    // リダイレクト先（修正: 許可ドメインのみ）
    const baseUrl = resolveBaseUrl(req, allowedOrigin);

    // Customer Portal セッション作成
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: baseUrl,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error('Portal error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
