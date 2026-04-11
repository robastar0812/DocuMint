// === keep-alive.js ===
// Supabase無料プランのPause（1週間無通信で停止）を防止するエンドポイント
// Vercel Cronから毎日自動で呼ばれる

module.exports = async function handler(req, res) {
  // CORS対応（修正: 自ドメインに制限）
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://docu-mint-two.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);

  try {
    // 修正: ハードコードURL → 環境変数に統一
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'SUPABASE_URL または SUPABASE_ANON_KEY が未設定です',
      });
    }

    // Supabase REST APIに軽量クエリを送信（profilesテーブルの件数を取得するだけ）
    const response = await fetch(
      `${supabaseUrl}/rest/v1/profiles?select=id&limit=1`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    const status = response.ok ? 'ok' : 'error';
    const timestamp = new Date().toISOString();

    return res.status(200).json({
      status,
      timestamp,
      message: 'Supabase keep-alive ping completed',
    });
  } catch (err) {
    console.error('Keep-alive error:', err.message);
    return res.status(200).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: err.message,
    });
  }
};
