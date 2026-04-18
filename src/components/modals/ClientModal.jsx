import { useState } from 'react';
import PostalInput from '../inputs/PostalInput.jsx';

export default function ClientModal({ client, setClient, onClose, showToast }) {
  const [form, setForm] = useState({...client});
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const handleSave = () => { setClient(form); onClose(); if(showToast) showToast('✅ 取引先情報を保存しました'); };
  return (
    <div className="modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)e.currentTarget._closeOnUp=true;}}
        onMouseUp={e=>{if(e.currentTarget._closeOnUp&&e.target===e.currentTarget){e.currentTarget._closeOnUp=false;onClose();}}}>
      <div className="modal-box" onKeyDown={e=>e.key==='Enter'&&e.target.tagName!=='TEXTAREA'&&e.target.tagName!=='SELECT'&&handleSave()}>
        <div className="modal-header"><div className="modal-title">取引先情報の入力</div><button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">会社名・氏名</label><input className="input" placeholder="株式会社〇〇 / 山田太郎" value={form.name} onChange={e=>set('name',e.target.value)} autoFocus /></div>
          <div className="form-group">
            <label className="form-label">敬称</label>
            <div style={{display:'flex',gap:8}}>
              {['御中','様','殿','各位'].map(h => (
                <button key={h} className={`btn ${form.honorific===h?'btn-primary':'btn-outline'}`} style={{padding:'6px 14px',fontSize:13}} onClick={() => set('honorific',h)}>{h}</button>
              ))}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">郵便番号</label>
              <div style={{fontSize:11,color:'var(--color-text-muted)',marginBottom:4}}>ハイフンを入れないでください（全角可）</div>
              <PostalInput value={form.postalCode} onChange={v=>set('postalCode',v)} onAddressFound={addr=>set('address',addr)} />
            </div>
          </div>
          <div className="form-group"><label className="form-label">住所</label><input className="input" placeholder="東京都〇〇区〇〇 1-2-3" value={form.address} onChange={e=>set('address',e.target.value)} /></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary" onClick={handleSave}>保存する</button>
        </div>
      </div>
    </div>
  );
}
