import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Supabaseデータ読込
export async function loadSupabaseData(userId) {
  try {
    const { data: profile } = await supabaseClient.from('profiles').select('is_pro').eq('id', userId).single();
    const { data: userData } = await supabaseClient.from('user_data').select('*').eq('user_id', userId).single();
    return { profile, userData };
  } catch (e) {
    console.warn('Supabaseデータ読込エラー:', e.message);
    return { profile: null, userData: null };
  }
}

// Supabaseデータ保存（2秒デバウンス）
let _saveTimer = null;
export function saveToSupabase(userId, state, onStart, onDone) {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(async () => {
    if (onStart) onStart();
    try {
      const payload = {
        user_id: userId,
        my_company: state.myCompany,
        client_data: state.client,
        doc_settings: {
          ...state.docSettings,
          _stampImage: state.doc.stampImage || null,
          _logoImage: state.doc.logoImage || null,
          _stampPosition: state.doc.stampPosition || null,
          _logoPosition: state.doc.logoPosition || null,
        },
        templates: state.templates,
        saved_docs: state.savedDocs.map(d => { const {stampImage, logoImage, ...rest} = (d.document || d); return {...d, document: rest}; }),
        updated_at: new Date().toISOString(),
      };
      await supabaseClient.from('user_data').upsert(payload, { onConflict: 'user_id' });
      if (onDone) onDone(true);
    } catch (e) {
      console.warn('Supabase保存エラー:', e.message);
      if (onDone) onDone(false);
    }
  }, 2000);
}
