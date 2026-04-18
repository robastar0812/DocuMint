import { useState, useEffect, useRef } from 'react';
import { useAppState } from './lib/storage.js';
import { useAuth } from './lib/auth.js';
import { supabaseClient, loadSupabaseData, saveToSupabase } from './lib/supabase.js';
import { TOUR_STEPS } from './lib/tourSteps.js';
import Toolbar from './components/Toolbar.jsx';
import Preview from './components/Preview.jsx';
import TourOverlay from './components/TourOverlay.jsx';
import CompanyModal from './components/modals/CompanyModal.jsx';
import ClientModal from './components/modals/ClientModal.jsx';
import SettingsModal from './components/modals/SettingsModal.jsx';
import HelpModal from './components/modals/HelpModal.jsx';
import InstallModal from './components/modals/InstallModal.jsx';
import UpgradeModal from './components/modals/UpgradeModal.jsx';
import AuthModal from './components/modals/AuthModal.jsx';
import PasswordResetModal from './components/modals/PasswordResetModal.jsx';

export default function App() {
  const state = useAppState();
  const { activeModal, setActiveModal, mobileTab, setMobileTab, myCompany, setMyCompany, client, setClient, docSettings, setDocSettings, isPro, setIsPro, loadAll } = state;
  const [tourStep, setTourStep] = useState(null);
  const [upgradeModal, setUpgradeModal] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [checkoutMsg, setCheckoutMsg] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = msg => { clearTimeout(toastTimer.current); setToast(msg); toastTimer.current = setTimeout(() => setToast(null), 2000); };
  const handlePDFRef = useRef(null);

  const { user, authLoading, signOut, updatePassword, authEvent, setAuthEvent } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const anyModal = !!(activeModal || upgradeModal || showInstall || showAuth);
    if (anyModal) { document.body.style.overflow = 'hidden'; } else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [activeModal, upgradeModal, showInstall, showAuth]);
  const [syncStatus, setSyncStatus] = useState(null);
  const prevUserId = useRef(null);
  const isLoadingFromCloud = useRef(false);

  useEffect(() => {
    if (!user || user.id === prevUserId.current) return;
    prevUserId.current = user.id;
    isLoadingFromCloud.current = true;
    setSyncStatus('syncing');
    loadSupabaseData(user.id).then(({ profile, userData }) => {
      const merged = {};
      if (userData) {
        if (userData.my_company && Object.keys(userData.my_company).length) merged.myCompany = userData.my_company;
        if (userData.client_data && Object.keys(userData.client_data).length) merged.client = userData.client_data;
        if (userData.doc_settings && Object.keys(userData.doc_settings).length) merged.docSettings = userData.doc_settings;
        if (Array.isArray(userData.templates)) merged.templates = userData.templates;
        if (Array.isArray(userData.saved_docs)) merged.savedDocs = userData.saved_docs;
      }
      if (profile) merged.isPro = profile.is_pro || false;
      if (Object.keys(merged).length) loadAll(merged);
      if (profile && profile.is_pro === true) {
        setIsPro(true);
      }
      setSyncStatus('synced');
      setTimeout(() => {
        isLoadingFromCloud.current = false;
        setSyncStatus(null);
      }, 1500);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabaseClient.from('profiles').select('is_pro').eq('id', user.id).single().then(({ data }) => {
      if (data && data.is_pro === true && !state.isPro) {
        setIsPro(true);
      }
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (isLoadingFromCloud.current) return;
    saveToSupabase(user.id, state,
      () => setSyncStatus('syncing'),
      (success) => {
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus(null), 2500);
      }
    );
    return () => {};
  }, [user, state.myCompany, state.client, state.docSettings, state.templates, state.savedDocs, state.doc.stampImage, state.doc.logoImage]);

  const handleSignOut = async () => {
    if (!confirm('ログアウトしますか？\nデータはクラウドに保存済みです。')) return;
    await signOut();
    setIsPro(false);
    prevUserId.current = null;
    setSyncStatus(null);
  };

  const [checkoutDone, setCheckoutDone] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    if (checkout === 'success') {
      setIsPro(true);
      setCheckoutDone(true);
      setCheckoutMsg({ type: 'success', text: '🎉 有料プランへのアップグレードが完了しました！保存テンプレート・保存書類が無制限になりました。' });
    } else if (checkout === 'cancel') {
      setCheckoutMsg({ type: 'cancel', text: '決済がキャンセルされました。いつでも再度お試しいただけます。' });
    }
    if (checkout) {
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setCheckoutMsg(null), 8000);
    }
  }, []);

  useEffect(() => {
    if (checkoutDone && user) {
      supabaseClient.from('profiles').update({ is_pro: true }).eq('id', user.id).then(() => {
        setCheckoutDone(false);
      }).catch(() => {
        setCheckoutDone(false);
        console.warn('Supabase is_pro更新に失敗しました。Webhookでリカバリーされます。');
      });
    }
  }, [checkoutDone, user]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=signup')) {
      setCheckoutMsg({ type: 'success', text: '✅ メール認証が完了しました！ログイン済みです。' });
      setTimeout(() => setCheckoutMsg(null), 6000);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const startTour = () => {
    setMobileTab('input');
    setTourStep(0);
  };

  return (
    <div className="app-layout">
      {toast && <div className="toast-notify" style={{top:'40%',bottom:'auto',fontSize:16,padding:'14px 32px'}}>{toast}</div>}
      <div className="mobile-tabs">
        <button className={`mobile-tab ${mobileTab==='input'?'active':''}`} onClick={() => { setMobileTab('input'); window.scrollTo(0,0); }} style={mobileTab==='input'?{fontSize:13,fontWeight:700,padding:'10px 8px'}:{background:'rgba(245,245,245,0.92)',color:'rgba(0,0,0,0.35)',fontSize:12}}>✏️ 入力</button>
        <button className={`mobile-tab ${mobileTab==='preview'?'active':''}`} onClick={() => { setMobileTab('preview'); window.scrollTo(0,0); }} style={mobileTab==='preview'?{fontSize:13,fontWeight:700,padding:'10px 8px'}:{background:'rgba(245,245,245,0.92)',color:'rgba(0,0,0,0.35)',fontSize:12}}>📄 プレビュー</button>
      </div>
      <aside className={`sidebar ${mobileTab==='preview'?'hidden':''}`} style={{display:'flex',flexDirection:'column',maxWidth:'100vw'}}>
        <div style={{flex:1,overflowY:'auto',overflowX:'hidden',display:'flex',flexDirection:'column',width:'100%',minWidth:0}}>
          <Toolbar state={state} onStartTour={startTour} onShowUpgrade={setUpgradeModal} onShowInstall={() => setShowInstall(true)} user={user} onShowAuth={() => setShowAuth(true)} onSignOut={handleSignOut} syncStatus={syncStatus} showToast={showToast} onRegisterPDF={fn => handlePDFRef.current = fn} />
        </div>
        <div style={{flexShrink:0,padding:'6px 16px',borderTop:'1px solid var(--color-border)',textAlign:'center',fontSize:10,color:'var(--color-text-light)',letterSpacing:'0.04em',background:'var(--color-surface)',lineHeight:1.6}}>
          {state.isPro && user && (
            <div style={{marginBottom:4}}>
              <button onClick={async () => {
                const win = window.open('', '_blank');
                try {
                  const res = await fetch('/api/create-portal-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email }),
                  });
                  const data = await res.json();
                  if (data.url) {
                    if(win){win.location.href=data.url;}else{window.location.href=data.url;}
                  } else {
                    if(win) win.close();
                    alert('プラン管理ページを開けませんでした。\n' + (data.error || ''));
                  }
                } catch (err) {
                  if(win) win.close();
                  alert('通信エラーが発生しました。');
                }
              }} style={{background:'none',border:'1px solid #e74c3c',color:'#e74c3c',padding:'3px 10px',borderRadius:6,fontSize:9,cursor:'pointer',fontFamily:'var(--font-sans)'}}>
                有料プランを解約する
              </button>
            </div>
          )}
          © 2026 ROBA★STAR (驢馬星)
          <span style={{margin:'0 4px'}}>|</span><a href="/tokushoho.html" style={{color:'var(--color-text-light)',textDecoration:'underline'}}>特商法</a>
          <span style={{margin:'0 4px'}}>|</span><a href="/privacy.html" style={{color:'var(--color-text-light)',textDecoration:'underline'}}>プライバシー</a>
          <span style={{margin:'0 4px'}}>|</span><a href="/terms.html" style={{color:'var(--color-text-light)',textDecoration:'underline'}}>利用規約</a>
        </div>
      </aside>
      <main className={`main-area ${mobileTab==='input'?'hidden':''}`}>
        <Preview state={state} />
      </main>
      {mobileTab === 'preview' && (
        <div className="mobile-bottom-bar">
          <button className="btn btn-back" onClick={() => { setMobileTab('input'); window.scrollTo(0,0); }}>✏️ 入力に戻る</button>
          <button className="btn btn-pdf" onClick={() => {
            const el = document.getElementById('a4-preview');
            if (!el || typeof window.html2pdf === 'undefined') return;
            const win = window.open('', '_blank');
            const label = ({'invoice':'請求書','receipt':'領収書','estimate':'見積書'})[state.doc.type] || '書類';
            const num = state.doc.number || '番号未設定';
            el.style.transform='none'; el.style.marginBottom='0'; el.style.minHeight='0'; el.style.height='1122px'; el.style.maxHeight='1122px'; el.style.overflow='hidden'; el.style.borderRadius='0'; el.style.boxShadow='none';
            const restore = () => { el.style.transform=''; el.style.marginBottom=''; el.style.minHeight=''; el.style.height=''; el.style.maxHeight=''; el.style.overflow=''; el.style.borderRadius=''; el.style.boxShadow=''; };
            const mainArea2 = el.closest('.main-area'); if (mainArea2) { mainArea2.scrollLeft = 0; mainArea2.scrollTop = 0; }
            window.html2pdf().set({ margin:0, filename:label+'_'+num+'.pdf', image:{type:'jpeg',quality:0.98}, html2canvas:{scale:2,useCORS:true,logging:false,width:794,height:1122,windowWidth:794,windowHeight:1122,scrollX:0,scrollY:0,x:0,y:0}, jsPDF:{unit:'mm',format:'a4',orientation:'portrait'} }).from(el).toPdf().get('pdf').then(pdf => { restore(); const blob = pdf.output('blob'); const url = URL.createObjectURL(blob); if(win){win.location.href=url;}else{window.location.href=url;} }).catch(() => { restore(); if(win) win.close(); });
          }}>📥 PDF（印刷）</button>
          <span style={{fontSize:11,color:'rgba(255,255,255,.7)',textAlign:'center',lineHeight:1.3,padding:'4px 0'}}>🖨️ 印刷はPDFから</span>
        </div>
      )}
      {activeModal==='myCompany' && <CompanyModal myCompany={myCompany} setMyCompany={setMyCompany} onClose={() => setActiveModal(null)} showToast={showToast} />}
      {activeModal==='client' && <ClientModal client={client} setClient={setClient} onClose={() => setActiveModal(null)} showToast={showToast} />}
      {activeModal==='settings' && <SettingsModal docSettings={docSettings} setDocSettings={setDocSettings} onClose={() => setActiveModal(null)} showToast={showToast} />}
      {activeModal==='help' && <HelpModal onClose={() => setActiveModal(null)} />}
      {tourStep !== null && (
        <TourOverlay
          step={tourStep}
          total={TOUR_STEPS.length}
          onNext={() => setTourStep(s => s+1)}
          onPrev={() => setTourStep(s => s-1)}
          onEnd={() => setTourStep(null)}
        />
      )}
      {upgradeModal && (
        <UpgradeModal type={upgradeModal} onClose={() => setUpgradeModal(null)} userEmail={user?.email} onRequireLogin={() => { setUpgradeModal(null); setShowAuth(true); }} isPro={state.isPro} />
      )}
      {showInstall && (
        <InstallModal onClose={() => setShowInstall(false)} />
      )}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onLogin={() => setShowAuth(false)} />
      )}
      {authEvent === 'PASSWORD_RECOVERY' && (
        <PasswordResetModal onClose={() => setAuthEvent(null)} updatePassword={updatePassword} />
      )}
      {checkoutMsg && (
        <div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',zIndex:9999,padding:'14px 24px',borderRadius:12,boxShadow:'0 8px 32px rgba(0,0,0,0.18)',fontSize:14,fontWeight:600,animation:'slideUp .3s ease',maxWidth:'90vw',textAlign:'center',background:checkoutMsg.type==='success'?'#f0fdf4':'#fefce8',color:checkoutMsg.type==='success'?'#166534':'#854d0e',border:checkoutMsg.type==='success'?'1px solid #bbf7d0':'1px solid #fde68a'}}>
          {checkoutMsg.text}
          <button onClick={() => setCheckoutMsg(null)} style={{marginLeft:12,background:'none',border:'none',cursor:'pointer',fontSize:14,color:'inherit',opacity:.6}}>✕</button>
        </div>
      )}
    </div>
  );
}
