import { useState } from 'react';

export default function PasswordResetModal({ onClose, updatePassword }) {
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSubmit = async () => {
    if (!newPass || !confirm) { setMsg({type:'error',text:'両方のフィールドを入力してください'}); return; }
    if (newPass.length < 6) { setMsg({type:'error',text:'パスワードは6文字以上にしてください'}); return; }
    if (newPass !== confirm) { setMsg({type:'error',text:'パスワードが一致しません'}); return; }
    setLoading(true); setMsg(null);
    const { error } = await updatePassword(newPass);
    setLoading(false);
    if (error) {
      setMsg({type:'error',text: error.message});
    } else {
      setMsg({type:'success',text:'✅ パスワードを更新しました！このままご利用いただけます。'});
      setTimeout(() => onClose(), 3000);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)e.currentTarget._closeOnUp=true;}}
        onMouseUp={e=>{if(e.currentTarget._closeOnUp&&e.target===e.currentTarget){e.currentTarget._closeOnUp=false;onClose();}}}>
      <div className="modal-box" style={{maxWidth:420}}>
        <div className="modal-header">
          <div className="modal-title">🔐 新しいパスワードを設定</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{fontSize:13,color:'var(--color-text-muted)',marginBottom:16,lineHeight:1.6}}>
            パスワードリセットのリンクから来ました。<br/>新しいパスワードを入力してください。
          </div>
          {msg && <div className={`auth-msg ${msg.type}`}>{msg.text}</div>}
          <div className="form-group">
            <label className="form-label">新しいパスワード（6文字以上）</label>
            <input className="input" type="password" placeholder="••••••" value={newPass} onChange={e=>setNewPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSubmit()} />
          </div>
          <div className="form-group">
            <label className="form-label">パスワード確認（もう一度入力）</label>
            <input className="input" type="password" placeholder="••••••" value={confirm} onChange={e=>setConfirm(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSubmit()} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? '⏳ 更新中...' : '🔐 パスワードを更新'}
          </button>
        </div>
      </div>
    </div>
  );
}
