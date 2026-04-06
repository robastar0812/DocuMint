// === keep-alive.js ===
// Supabase無料プランのPause（1週間無通信で停止）を防止するエンドポイント
// Vercel Cronから毎日自動で呼ばれる

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Supabase REST APIに軽量クエリを送信（profilesテーブルの件数を取得するだけ）
    const supabaseUrl = process.env.SUPABASE_URL || 'https://lbzvzniuqgzpjzccjaal.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

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
