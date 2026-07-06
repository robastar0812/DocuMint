const Stripe = require('stripe');

// === セキュリティ修正: ?checkout=success のURL偽装によるPro自己付与を防止 ===
// クライアントは session_id を送信し、本APIがStripeに「本当に支払い済みか」を照合。
// 支払い確認できた場合のみ、サーバー側(service role)で profiles.is_pro を更新する。
// （旧方式: クライアントが profiles.is_pro を直接更新 → URL偽装で自己付与可能だった）

// Supabase profiles.is_pro を更新するヘルパー（stripe-webhook.js と同一ロジック）
async function updateIsPro(email, isPro) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL または SUPABASE_SERVICE_ROLE_KEY が未設定です');
  }

  const updateRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ is_pro: isPro }),
    }
  );

  if (!updateRes.ok) {
    throw new Error(`Supabase更新失敗: ${updateRes.status}`);
  }

  const updated = await updateRes.json();
  if (!updated || updated.length === 0) {
    console.error(`[VerifyCheckout] profilesにユーザーが見つかりません: ${email}`);
    return false;
  }

  console.log(`[VerifyCheckout] ${email} の is_pro を ${isPro} に更新しました`);
  return true;
}

module.exports = async function handler(req, res) {
  // CORS対応（自ドメインに制限）
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
    const { session_id } = req.body || {};
    if (!session_id || typeof session_id !== 'string' || !/^cs_/.test(session_id)) {
      return res.status(400).json({ isPro: false, error: 'session_id が不正です' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    // Stripeに直接照合（クライアントの申告を信用しない）
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session || session.payment_status !== 'paid') {
      return res.status(402).json({ isPro: false, error: '支払いが確認できませんでした' });
    }

    const email = session.customer_details?.email || session.customer_email;
    if (email) {
      try {
        await updateIsPro(email, true);
      } catch (e) {
        // DB更新失敗でも支払い自体は確認済み → Webhookのリトライでリカバリーされる
        console.error(`[VerifyCheckout] is_pro更新エラー（Webhookでリカバリー）: ${e.message}`);
      }
    } else {
      console.error('[VerifyCheckout] セッションからメールアドレスが取得できません');
    }

    // 支払い確認済み → クライアントはPro表示してよい
    return res.status(200).json({ isPro: true });
  } catch (err) {
    console.error('VerifyCheckout error:', err.message);
    return res.status(500).json({ isPro: false, error: err.message });
  }
};
