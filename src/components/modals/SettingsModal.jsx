import { useState } from 'react';
import { defaultDocSettings } from '../../lib/storage.js';

export default function SettingsModal({ docSettings, setDocSettings, onClose, showToast }) {
  const FONTS = [
    {label:'明朝体（デフォルト）',value:"'Noto Serif JP', serif"},
    {label:'ゴシック体',value:"'Noto Sans JP', sans-serif"},
    {label:'システムフォント',value:"system-ui, sans-serif"},
  ];
  const PRESETS = [
    {label:'モノクロ',tableHeader:'#ffffff',amountBox:'#ffffff',totalBar:'#ffffff'},
    {label:'紺',tableHeader:'#3d5a80',amountBox:'#1a2744',totalBar:'#1a2744'},
    {label:'グリーン',tableHeader:'#3a7a5a',amountBox:'#1a4a2e',totalBar:'#1a4a2e'},
    {label:'ネイビー',tableHeader:'#3a6a8c',amountBox:'#1a3a5c',totalBar:'#1a3a5c'},
    {label:'ブラウン',tableHeader:'#7a6352',amountBox:'#4a3728',totalBar:'#4a3728'},
    {label:'ブラック',tableHeader:'#4a4a4a',amountBox:'#1a1a1a',totalBar:'#1a1a1a'},
  ];
  const [th, setTh] = useState(docSettings?.tableHeader||'#ffffff');
  const [ab, setAb] = useState(docSettings?.amountBox||'#ffffff');
  const [tb, setTb] = useState(docSettings?.totalBar||'#ffffff');
  const [font, setFont] = useState(docSettings?.docFont||FONTS[0].value);
  const isMono = th==='#ffffff';
  const pt = isMono?'#1a1a1a':'white';
  const pb = isMono?'1.5px solid #1a1a1a':'none';

  const handleApply = () => { setDocSettings({tableHeader:th,amountBox:ab,totalBar:tb,docFont:font}); onClose(); if(showToast) showToast('✅ デザイン設定を保存しました'); };
  return (
    <div className="modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)e.currentTarget._closeOnUp=true;}}
        onMouseUp={e=>{if(e.currentTarget._closeOnUp&&e.target===e.currentTarget){e.currentTarget._closeOnUp=false;onClose();}}}>
      <div className="modal-box" onKeyDown={e=>e.key==='Enter'&&e.target.tagName!=='INPUT'&&e.target.type!=='color'&&e.target.tagName!=='SELECT'&&handleApply()}>
        <div className="modal-header"><div className="modal-title">🎨 書類デザイン設定</div><button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">カラープリセット</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => { setTh(p.tableHeader); setAb(p.amountBox); setTb(p.totalBar); }} style={{padding:'6px 14px',borderRadius:6,border:`2px solid ${p.tableHeader==='#ffffff'?'#1a1a1a':p.tableHeader}`,background:'white',color:p.tableHeader==='#ffffff'?'#1a1a1a':p.tableHeader,fontFamily:'var(--font-sans)',fontSize:12,fontWeight:500,cursor:'pointer'}}>{p.label}</button>
              ))}
            </div>
          </div>
          <hr style={{margin:'16px 0',borderColor:'var(--color-border)'}} />
          {[{label:'明細テーブルのヘッダー色',value:th,set:setTh},{label:'請求金額ボックスの色',value:ab,set:setAb},{label:'合計エリアの色',value:tb,set:setTb}].map(item => (
            <div className="form-group" key={item.label}>
              <label className="form-label">{item.label}</label>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <input type="color" value={item.value} onChange={e=>item.set(e.target.value)} style={{width:48,height:36,border:'none',cursor:'pointer',borderRadius:4}} />
                <span style={{fontSize:13,color:'var(--color-text-muted)'}}>{item.value}</span>
                <div style={{flex:1,height:28,borderRadius:4,background:item.value,border:item.value==='#ffffff'?'1.5px solid #1a1a1a':'none',color:item.value==='#ffffff'?'#1a1a1a':'white',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center'}}>プレビュー</div>
              </div>
            </div>
          ))}
          <hr style={{margin:'16px 0',borderColor:'var(--color-border)'}} />
          <div className="form-group">
            <label className="form-label">A4書類のフォント</label>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {FONTS.map(f => (
                <label key={f.value} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
                  <input type="radio" name="docFont" value={f.value} checked={font===f.value} onChange={() => setFont(f.value)} />
                  <span style={{fontSize:14,fontFamily:f.value}}>{f.label}　サンプル文字</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{marginTop:16,border:'1px solid var(--color-border)',borderRadius:8,overflow:'hidden'}}>
            <div style={{fontSize:11,color:'#888',padding:'6px 12px',background:'#fafafa'}}>書類プレビュー</div>
            <div style={{padding:16,fontFamily:font}}>
              <div style={{fontSize:20,fontWeight:600,color:'#1a2744',marginBottom:8}}>請求書</div>
              <table style={{width:'100%',borderCollapse:'collapse',marginBottom:8}}>
                <thead><tr style={{background:th,border:pb}}><th style={{padding:'6px 8px',fontSize:11,textAlign:'left',color:pt}}>品目</th><th style={{padding:'6px 8px',fontSize:11,color:pt}}>数量</th><th style={{padding:'6px 8px',fontSize:11,textAlign:'right',color:pt}}>金額</th></tr></thead>
                <tbody><tr><td style={{padding:'4px 8px',fontSize:12}}>作業費</td><td style={{padding:'4px 8px',fontSize:12,textAlign:'center'}}>1</td><td style={{padding:'4px 8px',fontSize:12,textAlign:'right'}}>¥50,000</td></tr></tbody>
              </table>
              <div style={{background:ab,border:pb,color:pt,padding:'8px 12px',borderRadius:6,marginBottom:8}}><div style={{fontSize:10,opacity:.8}}>請求金額</div><div style={{fontSize:18,fontWeight:700}}>¥55,000</div></div>
              <div style={{background:tb,border:pb,color:pt,padding:'6px 12px',borderRadius:4,display:'flex',justifyContent:'space-between',fontSize:12}}><span>合計金額</span><span>¥55,000</span></div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => { setDocSettings(defaultDocSettings); onClose(); if(showToast) showToast('🔄 デザインをリセットしました'); }}>リセット</button>
          <button className="btn btn-outline" onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary" onClick={handleApply}>適用する</button>
        </div>
      </div>
    </div>
  );
}
