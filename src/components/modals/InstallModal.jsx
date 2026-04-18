import { useState } from 'react';

export default function InstallModal({ onClose }) {
  const [tab, setTab] = useState('iphone');
  const steps = {
    iphone: {
      label: 'iPhone（Safari）',
      icon: '🍎',
      color: '#555',
      steps: [
        'Safariで https://docu-mint-two.vercel.app を開く',
        '画面下部の「共有」ボタン（四角から矢印が出るアイコン）をタップ',
        '「ホーム画面に追加」をタップ',
        '名前を確認して「追加」をタップ',
        'ホーム画面にDocuMintのアイコンが追加されます！',
      ],
      note: '※ SafariのみOK。ChromeなどのブラウザではNG。',
    },
    android: {
      label: 'Android（Chrome）',
      icon: '🤖',
      color: '#27ae60',
      steps: [
        'Chromeで https://docu-mint-two.vercel.app を開く',
        '右上のメニュー（点3つ）をタップ',
        '「ホーム画面に追加」をタップ',
        '「追加」をタップ',
        'ホーム画面にDocuMintのアイコンが追加されます！',
      ],
      note: '※ ChromeまたはEdgeを使用してください。',
    },
    pc_chrome: {
      label: 'PC（Chrome）',
      icon: '💻',
      color: '#2d7cf6',
      steps: [
        'Chromeで https://docu-mint-two.vercel.app を開く',
        'アドレスバー右端の「インストール」アイコンをクリック',
        '「インストール」をクリック',
        'デスクトップにDocuMintのアイコンが追加されます！',
      ],
      note: '※ アイコンが表示されない場合はアドレスバー右端の⋮→「DocuMintをインストール」。',
    },
    pc_edge: {
      label: 'PC（Edge）',
      icon: '🔷',
      color: '#0078d4',
      steps: [
        'Edgeで https://docu-mint-two.vercel.app を開く',
        'アドレスバー右端の「アプリとして利用可能」をクリック',
        '「インストール」をクリック',
        'デスクトップにDocuMintのアイコンが追加されます！',
      ],
      note: '※ スタートメニューにも追加されます。',
    },
  };
  const current = steps[tab];
  const tabs = Object.entries(steps);

  return (
    <div className="modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)e.currentTarget._closeOnUp=true;}}
        onMouseUp={e=>{if(e.currentTarget._closeOnUp&&e.target===e.currentTarget){e.currentTarget._closeOnUp=false;onClose();}}}>
      <div className="modal-box" style={{maxWidth:500}}>
        <div className="modal-header">
          <div className="modal-title">📱 アプリとしてインストール</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{padding:'16px 20px'}}>
          <div style={{background:'linear-gradient(135deg,#f0fdf4,#f0f9ff)',border:'1px solid #d1e7dd',borderRadius:10,padding:'14px 16px',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
              <span style={{fontSize:28}}>📲</span>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:'#1a2744'}}>DocuMintをアプリとして使えます！</div>
                <div style={{fontSize:11,color:'#555',lineHeight:1.5,marginTop:2}}>ホーム画面にアプリアイコンが追加され、ワンタップで起動できます。インストール不要・完全無料です。</div>
              </div>
            </div>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:16}}>
            {tabs.map(([key, val]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                padding:'6px 12px', borderRadius:8, border:'1.5px solid',
                borderColor: tab===key ? val.color : '#e5e7eb',
                background: tab===key ? val.color : 'white',
                color: tab===key ? 'white' : '#555',
                fontSize:12, fontWeight:tab===key?700:400, cursor:'pointer',
              }}>
                {val.icon} {val.label}
              </button>
            ))}
          </div>
          <ol style={{listStyle:'none',padding:0,margin:0}}>
            {current.steps.map((step, i) => (
              <li key={i} style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:12}}>
                <span style={{
                  flexShrink:0, width:24, height:24, borderRadius:'50%',
                  background: current.color, color:'white',
                  fontSize:12, fontWeight:700,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>{i+1}</span>
                <span style={{fontSize:13,color:'#333',lineHeight:1.6,paddingTop:3}}>{step}</span>
              </li>
            ))}
          </ol>
          <div style={{marginTop:12,padding:'10px 12px',background:'#fefce8',border:'1px solid #fde68a',borderRadius:8,fontSize:11,color:'#78350f'}}>
            {current.note}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  );
}
