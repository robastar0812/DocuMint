import { useState } from 'react';
import { supabaseClient } from '../../lib/supabase.js';

export default function AuthModal({ onClose, onLogin }) {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleLogin = async () => {
    if (!email || !password) { setMsg({type:'error',text:'メールアドレスとパスワードを入力してください'}); return; }
    setLoading(true); setMsg(null);
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMsg({type:'error',text: error.message === 'Invalid login credentials' ? 'メールアドレスまたはパスワードが正しくありません' : error.message});
    } else {
      if (onLogin) onLogin();
      onClose();
    }
  };

  const handleSignup = async () => {
    if (!email || !password) { setMsg({type:'error',text:'メールアドレスとパスワードを入力してください'}); return; }
    if (password.length < 6) { setMsg({type:'error',text:'パスワードは6文字以上にしてください'}); return; }
    setLoading(true); setMsg(null);
    const { error } = await supabaseClient.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setMsg({type:'error',text: error.message});
    } else {
      setMsg({type:'success',text:'📧 確認メールを送信しました！メール内のリンクをクリックしてアカウントを有効化してください。'});
    }
  };

  const handleReset = async () => {
    if (!email) { setMsg({type:'error',text:'メールアドレスを入力してください'}); return; }
    setLoading(true); setMsg(null);
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setLoading(false);
    if (error) {
      setMsg({type:'error',text: error.message});
    } else {
      setMsg({type:'success',text:'📧 パスワードリセットメールを送信しました。メールを確認してください。'});
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)e.currentTarget._closeOnUp=true;}}
        onMouseUp={e=>{if(e.currentTarget._closeOnUp&&e.target===e.currentTarget){e.currentTarget._closeOnUp=false;onClose();}}}>
      <div className="modal-box" style={{maxWidth:420}}>
        <div className="modal-header">
          <div className="modal-title">{tab==='reset'?'パスワードリセット':'アカウント'}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form autoComplete="on" onSubmit={e=>{e.preventDefault();tab==='login'?handleLogin():tab==='signup'?handleSignup():handleReset();}}>
        <div className="modal-body">
          {tab !== 'reset' && (
            <div className="auth-tabs">
              <button type="button" className={`auth-tab ${tab==='login'?'active':''}`} onClick={()=>{setTab('login');setMsg(null);}}>ログイン</button>
              <button type="button" className={`auth-tab ${tab==='signup'?'active':''}`} onClick={()=>{setTab('signup');setMsg(null);}}>新規登録</button>
            </div>
          )}
          {msg && <div className={`auth-msg ${msg.type}`}>{msg.text}</div>}
          <div className="form-group">
            <label className="form-label">メールアドレス</label>
            <input className="input" type="email" name="email" autoComplete="email" placeholder="example@mail.com" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          {tab !== 'reset' && (
            <div className="form-group">
              <label className="form-label">パスワード{tab==='signup'?' （6文字以上）':''}</label>
              <input className="input" type="password" name="password" autoComplete={tab==='login'?'current-password':'new-password'} placeholder="••••••" value={password} onChange={e=>setPassword(e.target.value)} />
            </div>
          )}
        </div>
        <div className="modal-footer" style={{flexDirection:'column',gap:8}}>
          {tab === 'login' && (
            <>
              <button type="submit" className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} disabled={loading}>
                {loading ? '⏳ ログイン中...' : '🔑 ログイン'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" style={{fontSize:11}} onClick={()=>{setTab('reset');setMsg(null);}}>パスワードを忘れた方</button>
            </>
          )}
          {tab === 'signup' && (
            <button type="submit" className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} disabled={loading}>
              {loading ? '⏳ 登録中...' : '✨ 無料アカウント作成'}
            </button>
          )}
          {tab === 'reset' && (
            <>
              <button type="submit" className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} disabled={loading}>
                {loading ? '⏳ 送信中...' : '📧 リセットメール送信'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={()=>{setTab('login');setMsg(null);}}>← ログインに戻る</button>
            </>
          )}
        </div>
        </form>
        <div style={{padding:'0 28px 20px'}}>
          <div style={{background:'linear-gradient(135deg,#f0f4ff,#f5f0ff)',border:'1px solid #e0d8f0',borderRadius:10,padding:'14px 16px'}}>
            <div style={{fontSize:12,fontWeight:700,color:'#1a2744',marginBottom:8,textAlign:'center'}}>📦 ログインするとできること</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {[
                ['☁️','データをクラウドに自動バックアップ'],
                ['📱','スマホ・PC・タブレットでデータ共有'],
                ['🔄','機種変更してもデータが消えない'],
                ['🔒','ログインしなくても今まで通り使えます'],
              ].map(([icon, text]) => (
                <div key={text} style={{display:'flex',alignItems:'center',gap:8,fontSize:11,color:'#444',lineHeight:1.4}}>
                  <span style={{fontSize:14,flexShrink:0}}>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <div style={{marginTop:8,fontSize:10,color:'var(--color-text-light)',textAlign:'center',lineHeight:1.4}}>
              ※ アカウント登録・ログインは無料です
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
