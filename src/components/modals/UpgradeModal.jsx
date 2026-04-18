import { useState } from 'react';

export default function UpgradeModal({ type, onClose, userEmail, onRequireLogin, isPro }) {
  const typeLabel = type === 'template' ? '保存テンプレート' : '保存書類';
  const isVoluntary = type === 'upgrade';
  const [loading, setLoading] = useState(false);

  if (isPro) {
    return (
      <div className="modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)e.currentTarget._closeOnUp=true;}}
          onMouseUp={e=>{if(e.currentTarget._closeOnUp&&e.target===e.currentTarget){e.currentTarget._closeOnUp=false;onClose();}}}>
        <div className="modal-box" style={{maxWidth:400,textAlign:'center',padding:32}}>
          <div style={{fontSize:48,marginBottom:12}}>✅</div>
          <div style={{fontSize:18,fontWeight:700,color:'#1a2744',marginBottom:12}}>有料プラン加入済みです</div>
          <div style={{fontSize:13,color:'#666',lineHeight:1.6,marginBottom:20}}>保存テンプレート・保存書類は<strong>無制限</strong>でご利用いただけます。</div>
          <button style={{padding:'10px 24px',border:'none',borderRadius:10,background:'linear-gradient(90deg,#6c3fd4,#2d7cf6)',color:'white',fontSize:14,fontWeight:700,cursor:'pointer'}} onClick={onClose}>閉じる</button>
        </div>
      </div>
    );
  }

  const handleUpgrade = async () => {
    if (!userEmail) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail || '' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('決済ページの作成に失敗しました。\n' + (data.error || ''));
        setLoading(false);
      }
    } catch (err) {
      alert('通信エラーが発生しました。\nネットワーク接続を確認してください。');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)e.currentTarget._closeOnUp=true;}}
        onMouseUp={e=>{if(e.currentTarget._closeOnUp&&e.target===e.currentTarget){e.currentTarget._closeOnUp=false;onClose();}}}>
      <div className="modal-box" style={{maxWidth:440,textAlign:'center'}}>
        <div style={{padding:'28px 28px 0'}}>
          <div style={{fontSize:48,marginBottom:12}}>{isVoluntary ? '✨' : '🔒'}</div>
          <div style={{fontSize:18,fontWeight:700,color:'#1a2744',marginBottom:8}}>
            {isVoluntary ? '有料プランにアップグレード' : '無料プランの上限に達しました'}
          </div>
          <div style={{fontSize:13,color:'#666',lineHeight:1.6,marginBottom:20}}>
            {isVoluntary
              ? <>有料プランにアップグレードすると<br/>保存テンプレート・保存書類が<strong>無制限</strong>になります！</>
              : <>{typeLabel}は無料プランでは<strong>2件まで</strong>保存できます。<br/>有料プランにアップグレードすると<strong>無制限</strong>で使えます！</>
            }
          </div>
        </div>
        <div style={{margin:'0 24px 20px',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',background:'#f8fafc'}}>
            <div style={{padding:'10px',borderRight:'1px solid #e5e7eb',fontSize:12,fontWeight:600,color:'#888'}}></div>
            <div style={{padding:'10px',borderRight:'1px solid #e5e7eb',fontSize:12,fontWeight:600,color:'#888'}}>無料プラン</div>
            <div style={{padding:'10px',fontSize:12,fontWeight:700,background:'linear-gradient(90deg,#6c3fd4,#2d7cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>有料プラン ¥500/月</div>
          </div>
          {[
            ['保存テンプレート', '2件まで', '無制限'],
            ['保存書類', '2件まで', '無制限'],
            ['デザイン設定', '✅', '✅'],
            ['クラウド同期', '✅（要ログイン）', '✅'],
          ].map(([feat, free, paid]) => (
            <div key={feat} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',borderTop:'1px solid #e5e7eb',fontSize:12}}>
              <div style={{padding:'8px',color:'#555',textAlign:'left',paddingLeft:12}}>{feat}</div>
              <div style={{padding:'8px',color:'#999',borderLeft:'1px solid #e5e7eb'}}>{free}</div>
              <div style={{padding:'8px',color:'#2d7cf6',fontWeight:600,borderLeft:'1px solid #e5e7eb'}}>{paid}</div>
            </div>
          ))}
        </div>
        <div style={{padding:'0 24px 24px',display:'flex',flexDirection:'column',gap:10}}>
          <button
            style={{padding:'12px',border:'none',borderRadius:10,background: loading ? '#aaa' : 'linear-gradient(90deg,#6c3fd4,#2d7cf6)',color:'white',fontSize:14,fontWeight:700,cursor: loading ? 'wait' : 'pointer',opacity: loading ? 0.7 : 1}}
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? '⏳ 決済ページを準備中...' : '🚀 有料プランにアップグレード'}
          </button>
          <button
            style={{padding:'10px',border:'1.5px solid #e5e7eb',borderRadius:10,background:'white',color:'#666',fontSize:13,cursor:'pointer'}}
            onClick={onClose}
          >
            今は無料のまま使う
          </button>
        </div>
      </div>
    </div>
  );
}
