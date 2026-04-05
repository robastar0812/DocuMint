const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  // CORS対応
  res.setHeader('Access-Control-Allow-Origin', '*');
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
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'メールアドレスが必要です' });
    }

    // メールアドレスからStripe顧客を検索
    const customers = await stripe.customers.list({ email: email, limit: 1 });

    if (customers.data.length === 0) {
      return res.status(404).json({ error: '有料プランの登録が見つかりません' });
    }

    const customerId = customers.data[0].id;

    // リダイレクト先
    const origin = req.headers.origin || req.headers.referer || 'https://docu-mint-two.vercel.app';
    const baseUrl = origin.replace(/\/$/, '');

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
