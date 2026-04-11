const Stripe = require('stripe');

// Vercel Serverless: bodyParserを無効化（Stripe署名検証に生のリクエストボディが必要）
module.exports.config = { api: { bodyParser: false } };

// リクエストボディをBufferとして読み取るヘルパー
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Supabase profiles.is_pro を更新するヘルパー
async function updateIsPro(email, isPro) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL または SUPABASE_SERVICE_ROLE_KEY が未設定です');
  }

  // メールアドレスからユーザーIDを取得（auth.users テーブル）
  const usersRes = await fetch(
    `${supabaseUrl}/auth/v1/admin/users`,
    {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    }
  );

  if (!usersRes.ok) {
    throw new Error(`Supabase users取得失敗: ${usersRes.status}`);
  }

  const usersData = await usersRes.json();
  const user = usersData.users
    ? usersData.users.find(u => u.email === email)
    : null;

  if (!user) {
    console.error(`[Webhook] ユーザーが見つかりません: ${email}`);
    return false;
  }

  // profiles テーブルの is_pro を更新
  const updateRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ is_pro: isPro }),
    }
  );

  if (!updateRes.ok) {
    throw new Error(`Supabase更新失敗: ${updateRes.status}`);
  }

  console.log(`[Webhook] ${email} の is_pro を ${isPro} に更新しました`);
  return true;
}

module.exports = async function handler(req, res) {
  // CORS対応（自ドメインに制限）
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://docu-mint-two.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET が未設定です');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    // 生のリクエストボディを取得
    const rawBody = await readRawBody(req);
    const signature = req.headers['stripe-signature'];

    // Stripe署名検証（改ざん防止）
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error(`[Webhook] 署名検証失敗: ${err.message}`);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  try {
    switch (event.type) {
      // === BUG-5修正: 決済成功 → is_pro = true ===
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email = session.customer_email || session.customer_details?.email;
        if (email) {
          await updateIsPro(email, true);
        } else {
          // customer_emailが無い場合、customer IDからメール取得
          if (session.customer) {
            const customer = await stripe.customers.retrieve(session.customer);
            if (customer.email) {
              await updateIsPro(customer.email, true);
            }
          }
          console.error('[Webhook] checkout.session.completed: メールアドレスが取得できません');
        }
        break;
      }

      // === BUG-3修正: サブスク解約 → is_pro = false ===
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);
        if (customer.email) {
          await updateIsPro(customer.email, false);
        }
        break;
      }

      // === サブスク更新（一時停止・再開など） ===
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);
        if (customer.email) {
          // active または trialing → Pro有効、それ以外 → Pro無効
          const isActive = ['active', 'trialing'].includes(subscription.status);
          await updateIsPro(customer.email, isActive);
        }
        break;
      }

      // === 支払い失敗 → is_pro = false ===
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.customer) {
          const customer = await stripe.customers.retrieve(invoice.customer);
          if (customer.email) {
            await updateIsPro(customer.email, false);
          }
        }
        break;
      }

      default:
        // 処理不要なイベントは無視（正常応答）
        break;
    }

    // Stripeに200を返す（必須：返さないとリトライされる）
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(`[Webhook] イベント処理エラー: ${err.message}`);
    // 500を返すとStripeがリトライする → 一時的なエラーなら再試行で成功する可能性あり
    return res.status(500).json({ error: err.message });
  }
};
