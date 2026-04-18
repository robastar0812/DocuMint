import { useState } from 'react';
import PostalInput from '../inputs/PostalInput.jsx';
import PhoneInput from '../inputs/PhoneInput.jsx';

export default function CompanyModal({ myCompany, setMyCompany, onClose, showToast }) {
  const [form, setForm] = useState({...myCompany});
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const handleSave = () => { setMyCompany(form); onClose(); if(showToast) showToast('✅ 自社情報を保存しました'); };
  return (
    <div className="modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)e.currentTarget._closeOnUp=true;}}
        onMouseUp={e=>{if(e.currentTarget._closeOnUp&&e.target===e.currentTarget){e.currentTarget._closeOnUp=false;onClose();}}}>
      <div className="modal-box" onKeyDown={e=>e.key==='Enter'&&e.target.tagName!=='TEXTAREA'&&e.target.tagName!=='SELECT'&&handleSave()}>
        <div className="modal-header"><div className="modal-title">自社情報の設定</div><button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">会社名</label><input className="input" placeholder="株式会社〇〇" value={form.name} onChange={e=>set('name',e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">郵便番号</label>
              <div style={{fontSize:11,color:'var(--color-text-muted)',marginBottom:4}}>ハイフンを入れないでください（全角可）</div>
              <PostalInput value={form.postalCode} onChange={v=>set('postalCode',v)} onAddressFound={addr=>set('address',addr)} />
            </div>
          </div>
          <div className="form-group"><label className="form-label">住所</label><input className="input" placeholder="東京都〇〇区〇〇 1-2-3" value={form.address} onChange={e=>set('address',e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">電話番号</label>
              <div style={{fontSize:11,color:'var(--color-text-muted)',marginBottom:4}}>ハイフンを入れないでください（全角可）</div>
              <PhoneInput value={form.phone} onChange={v=>set('phone',v)} placeholder="03-0000-0000" />
            </div>
            <div className="form-group">
              <label className="form-label">FAX</label>
              <div style={{fontSize:11,color:'var(--color-text-muted)',marginBottom:4}}>ハイフンを入れないでください（全角可）</div>
              <PhoneInput value={form.fax} onChange={v=>set('fax',v)} placeholder="03-0000-0001" />
            </div>
          </div>
          <div className="form-group"><label className="form-label">メールアドレス</label><input className="input" type="email" placeholder="info@example.com" value={form.email} onChange={e=>set('email',e.target.value)} /></div>
          <div className="form-group"><label className="form-label">インボイス登録番号</label><input className="input" placeholder="T1234567890123" value={form.registrationNumber} onChange={e=>set('registrationNumber',e.target.value)} /></div>
          <hr style={{margin:'16px 0',borderColor:'var(--color-border)'}} />
          <div style={{fontSize:12,fontWeight:700,color:'var(--color-text-muted)',marginBottom:12,letterSpacing:'0.06em'}}>振込先口座</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">銀行名</label><input className="input" placeholder="〇〇銀行" value={form.bankName} onChange={e=>set('bankName',e.target.value)} /></div>
            <div className="form-group"><label className="form-label">支店名</label><input className="input" placeholder="〇〇支店" value={form.bankBranch} onChange={e=>set('bankBranch',e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">口座種別</label><select className="input" value={form.bankType} onChange={e=>set('bankType',e.target.value)}><option>普通</option><option>当座</option></select></div>
            <div className="form-group"><label className="form-label">口座番号</label><input className="input" placeholder="1234567" value={form.bankNumber} onChange={e=>set('bankNumber',e.target.value)} /></div>
          </div>
          <div className="form-group"><label className="form-label">口座名義</label><input className="input" placeholder="カ）マルマル" value={form.bankHolder} onChange={e=>set('bankHolder',e.target.value)} /></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary" onClick={handleSave}>保存する</button>
        </div>
      </div>
    </div>
  );
}
