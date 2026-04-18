import { useState, useEffect, useRef } from 'react';
import { calcTax, formatCurrency, DOC_TYPE_LABELS } from '../lib/utils.js';
import StampUploader from './StampUploader.jsx';
import ItemsEditor from './ItemsEditor.jsx';
import HistoryPanel from './HistoryPanel.jsx';

export default function Toolbar({ state, onStartTour, onShowUpgrade, onShowInstall, user, onShowAuth, onSignOut, syncStatus, showToast, onRegisterPDF }) {
  const { doc, setDocument, setDocumentType, setActiveModal, addItem, removeItem, updateItem, resetDocument, myCompany, client, setMyCompany, setClient, setStampImage, setLogoImage, templates, saveTemplate, loadTemplate, deleteTemplate, savedDocs, saveDocument, loadDocument, deleteDoc, duplicateDocument, isPro } = state;
  const { subtotal, taxAmount, total } = calcTax(doc.items);
  const [conveniOpen, setConveniOpen] = useState(false);
  const [conveniStore, setConveniStore] = useState('seven');
  const [newDocSuccess, setNewDocSuccess] = useState(false);
  const panelRef = useRef(null);
  const [isPC, setIsPC] = useState(window.innerWidth > 768);
  const [isNarrow, setIsNarrow] = useState(window.innerWidth <= 500);
  useEffect(() => {
    const onResize = () => { setIsPC(window.innerWidth > 768); setIsNarrow(window.innerWidth <= 500); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const CONVENI = {
    seven:{label:'セブン-イレブン',color:'#007940',bg:'#f0faf4',border:'#a7d7b8',app:'セブン‑イレブン マルチコピー',appStore:'https://apps.apple.com/jp/app/id1562641276',playStore:'https://play.google.com/store/apps/details?id=com.fujifilm.fb.mcopy&hl=ja',steps:['アプリでPDFをアップロードして予約番号（8桁）を取得','セブン-イレブンのマルチコピー機に行く','「プリント」→「ネットプリント」を選択','コピー機に予約番号を入力','用紙・カラー・枚数を確認して「プリントスタート」','料金を投入（白黒A4：20円 / カラーA4：60円）'],tips:['予約番号の有効期限は登録から30日間','ファイルサイズは10MB以内']},
    famima:{label:'ファミマ・ローソン',color:'#0066b3',bg:'#f0f6ff',border:'#a3c4e8',app:'ネットワークプリント',appStore:'https://apps.apple.com/jp/app/id454644833',playStore:'https://play.google.com/store/apps/details?id=jp.co.sharp.printsystem.networkprint&hl=ja',steps:['アプリでPDFをアップロードしてユーザー番号（8桁）を取得','ファミリーマート／ローソンのマルチコピー機に行く','「プリントサービス」→「ネットワークプリント」を選択','コピー機にユーザー番号を入力','ファイルを選択し用紙・カラー・部数を確認','料金を投入（白黒A4：20円 / カラーA4：60円）'],tips:['ユーザー番号の有効期限は登録から7日間','ファイルサイズは10MB以内']},
  };
  const cd = CONVENI[conveniStore];

  const [pdfLoading, setPdfLoading] = useState(false);
  const handlePDF = () => {
    if (pdfLoading) return;
    const label = DOC_TYPE_LABELS[doc.type];
    const num = doc.number || '番号未設定';
    const filename = label + '_' + num + '.pdf';
    const el = document.getElementById('a4-preview');
    if (!el) { alert('プレビューの読み込みに失敗しました。ページを再読み込みしてください。'); return; }
    if (typeof window.html2pdf === 'undefined') { alert('PDFライブラリを読み込み中です。少し待ってから再度お試しください。'); return; }
    setPdfLoading(true);
    el.style.transform = 'none';
    el.style.marginBottom = '0';
    el.style.minHeight = '0';
    el.style.height = '1122px';
    el.style.maxHeight = '1122px';
    el.style.overflow = 'hidden';
    el.style.borderRadius = '0';
    el.style.boxShadow = 'none';
    const restore = () => { el.style.transform = ''; el.style.marginBottom = ''; el.style.minHeight = ''; el.style.height = ''; el.style.maxHeight = ''; el.style.overflow = ''; el.style.borderRadius = ''; el.style.boxShadow = ''; setPdfLoading(false); };
    const mainArea = el.closest('.main-area');
    if (mainArea) { mainArea.scrollLeft = 0; mainArea.scrollTop = 0; }
    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, width: 794, height: 1122, windowWidth: 794, windowHeight: 1122, scrollX: 0, scrollY: 0, x: 0, y: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    window.html2pdf().set(opt).from(el).save().then(restore).catch(restore);
  };
  const handlePDFRef_inner = useRef(handlePDF);
  handlePDFRef_inner.current = handlePDF;
  useEffect(() => { if (onRegisterPDF) onRegisterPDF(() => handlePDFRef_inner.current()); }, []);

  return (
    <div className="toolbar" style={{overflowX:'hidden',width:'100%',minWidth:0}}>
      <div className="toolbar-header" style={{flexDirection:'column',alignItems:'stretch',gap:0,padding:'10px 14px 8px'}}>
        {isPC ? (
          <div style={{marginBottom:6,padding:'12px 0'}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4,justifyContent:'center'}}>
              <div className="toolbar-logo" style={{fontSize:28}}>DocuMint</div>
              {isPro && user && <span style={{fontSize:12,fontWeight:800,color:'white',background:'linear-gradient(90deg,#b8860b,#daa520,#ffd700)',borderRadius:6,padding:'4px 10px',lineHeight:1.2,letterSpacing:'.05em',boxShadow:'0 1px 4px rgba(218,165,32,0.4)'}}>✦ PRO</span>}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6,overflow:'hidden',justifyContent:'flex-end'}}>
              {user && syncStatus && <span className={`sync-indicator ${syncStatus}`} title={syncStatus==='syncing'?'クラウド同期中':'同期完了'}>{syncStatus==='syncing'?'⏳':'✅'}</span>}
              {user ? (
                <div style={{position:'relative'}}>
                  <button className="auth-btn logged-in" onClick={onSignOut} title={user.email}>
                    👤 {user.email.split('@')[0]}
                  </button>
                </div>
              ) : (
                <button className="auth-btn" onClick={onShowAuth}>🔑 ログイン</button>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => { if(confirm('現在の入力内容がリセットされます。\nよろしいですか？')) { resetDocument(); showToast('✅ 新規書類を作成しました'); setNewDocSuccess(true); setTimeout(() => setNewDocSuccess(false), 2000); } else { showToast('キャンセルしました'); } }} style={{fontSize:11,padding:'4px 8px',minWidth:0,border:'1.5px solid var(--color-border-dark)',background:newDocSuccess?'#e8f5e9':'transparent',color:newDocSuccess?'#2e7d32':undefined,transition:'all .3s'}}>{newDocSuccess?'✅ 作成しました':'＋ 新規'}</button>
            </div>
          </div>
        ) : (
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6,padding:'12px 0',overflow:'hidden'}}>
            <div style={{display:'flex',alignItems:'center',gap:6,minWidth:0}}>
              <div className="toolbar-logo" style={{fontSize:28}}>DocuMint</div>
              {isPro && user && <span style={{fontSize:12,fontWeight:800,color:'white',background:'linear-gradient(90deg,#b8860b,#daa520,#ffd700)',borderRadius:6,padding:'4px 10px',lineHeight:1.2,letterSpacing:'.05em',boxShadow:'0 1px 4px rgba(218,165,32,0.4)'}}>✦ PRO</span>}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6,minWidth:0,overflow:'hidden'}}>
              {user && syncStatus && <span className={`sync-indicator ${syncStatus}`} title={syncStatus==='syncing'?'クラウド同期中':'同期完了'}>{syncStatus==='syncing'?'⏳':'✅'}</span>}
              {user ? (
                <div style={{position:'relative'}}>
                  <button className="auth-btn logged-in" onClick={onSignOut} title={user.email}>
                    👤 {user.email.split('@')[0]}
                  </button>
                </div>
              ) : (
                <button className="auth-btn" onClick={onShowAuth}>🔑 ログイン</button>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => { if(confirm('現在の入力内容がリセットされます。\nよろしいですか？')) { resetDocument(); showToast('✅ 新規書類を作成しました'); setNewDocSuccess(true); setTimeout(() => setNewDocSuccess(false), 2000); } else { showToast('キャンセルしました'); } }} style={{fontSize:11,padding:'4px 8px',minWidth:0,border:'1.5px solid var(--color-border-dark)',background:newDocSuccess?'#e8f5e9':'transparent',color:newDocSuccess?'#2e7d32':undefined,transition:'all .3s'}}>{newDocSuccess?'✅ 作成しました':'＋ 新規'}</button>
            </div>
          </div>
        )}
        <div style={{display:'flex',gap:isPC ? 4 : 8,overflow:'hidden'}}>
          <button className="btn btn-ghost btn-sm" onClick={onStartTour} style={{flex:1,fontSize:isPC ? 11 : 13,padding:'12px 0',color:'#f59e0b',justifyContent:'center',minWidth:0,overflow:'hidden',background:'rgba(0,0,0,0.04)',borderRadius:6}}>🔰 ツアー</button>
          <button className="btn btn-ghost btn-sm" onClick={onShowInstall} style={{flex:1,fontSize:isPC ? 11 : 13,padding:'12px 0',color:'#27ae60',justifyContent:'center',minWidth:0,overflow:'hidden',background:'rgba(0,0,0,0.04)',borderRadius:6}}>🏠 アプリ化</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setActiveModal('help')} style={{flex:1,fontSize:isPC ? 11 : 13,padding:'12px 0',justifyContent:'center',minWidth:0,overflow:'hidden',background:'rgba(0,0,0,0.04)',borderRadius:6}}>❓ 操作説明</button>
          <button className="btn btn-ghost btn-sm" id="tour-design" onClick={() => setActiveModal('settings')} style={{flex:1,fontSize:isPC ? 11 : 13,padding:'12px 0',justifyContent:'center',minWidth:0,overflow:'hidden',background:'rgba(0,0,0,0.04)',borderRadius:6}}><img alt="デザイン" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAAAEHElEQVR4nMWUbUxbZRTHz3nuvX25pVDeLKyAwJjC7AZOpiMqsCXDJeiXaTFZjBpjpn5wyUjMYlxWKmhMNEZjlozIZ+Na3zDRTBy0iLzIhiPDDsbLaqGwxbZYCqW0vc89fiAIsrlvxn9yvpxz8jvPSc7zB/g/RES4HoB3KCLYnMLdAUBIThLI6RS2E4gAyW0XiQBtTro7CADAabu9iXw+HZHbROTWba+duLpsrjwbadh4rbgd1uRCbidib7bfahRMgVqWfvMhftOdB6urChpiEg91TEM46mUDHR+decq7Z7gv+cW8L/QZAnRRC2xutAEb/zRVXxBOvKsT5ipFS1gG2Qsw3QGQY1gFdU2Gw4cAknHo9tf4WmdtOX0DEb96dfxhGKpZAwBg6zCn0ORCfvnDRJNuEno0F3prRO+1eNz1G09CXP1z9pYa6f5JjgJXIe6Dvutm/xn34cL+zkvG10vbZmkwhGAHJEJAshNDB1O73ojsMivyaB4T5Hi/UxUDASY3GiHj5TSV64Kqoo0JmnzA6WnWd3HkQKS9Z+FI/p6v4eyLXOJR87ny+8+9RmQTRA8AAyA1FdSeTDOJ8rImuZJ59EnJYPRrpZJFYHKSsdIiJoVuJNb6hlOTlwxpvZFrj1sPXqGGp7l6xaBXfJHQUTg524xYFGf1DuAAAEvAawanUjQTYDT8q6TcmDdxZtpB8bW0TuDS861L+yJ93jV92HP+wcz9q1BtewBH+F7h20ie+OPMbu5ML+QAgCICUnv7ZWl+lGelMhUc+XnFaMoWIecRPec6M+pXTe+jh1uk7Nxc81g1vHqA1Ox9pfDNd/MLTN3NjSZdola41/6sA5O29bslJGrBV46/MFZWVVIhiiuKXiYxbF1Q1KxkcmdSntHE9OX9gYgmWxcF62Ml5F8OB4yrhcdeKjKOZjDNSpRSf58e1tWR2NuLyom3Rt9bUMtO7T1kSA1Fp6Wugm5iWkYHFSt7x2qFArUnlCYllwaT+TuHpGJlkhaVSRab+MUXf8Y2Gv7dZfMSoENlHg9wIMKP23I/kPnUXGf/ihQzWVIlwQoqmC1iOelWddp3gczeU5mGsdZC/cyXMAFMmBcTwtyyoapyWHfE1dTEwVPPAAAYIpK9BRDREmprTm+skvzX/xjikoZqWW7pE2o0zagOZT3KuzVN0IMNwucFx7h/aQmnhlJS2VeR4NvGe34AIrR7PCoAbLqH3U7M4UCVaDHjk/PB5osz0nMBnbGUCjSgKwZYyyJIigmQImEwzATj5XH5+9MVO06XVFsmiAgRkf4B3Apd/+ez+oEBZf/AQqoqJCQsXBuXdALGCgXt+PFd9w1KxXqfAuvWtgG7o4gI6+xu8V8bNqczu53Y9vTthrkF7HIB8+Z60LMlXw8A4KlXNzb5z/UXmxIJwJ6XTDAAAAAASUVORK5CYII=" style={{width:20,height:20,verticalAlign:"middle",marginRight:isPC ? 0 : 3}} /> デザイン</button>
        </div>
      </div>
      {!(isPro && user) && (
        <div className="pro-marquee" onClick={() => onShowUpgrade('upgrade')}>
          <div className="pro-marquee-track">
            <span>✨ 月額¥500で書類保存・テンプレートが無制限</span>
            <span>🔍 Proなら書類検索＆タイプフィルターが使える</span>
            <span>📋 書類の複製ワンタップ！先月の請求書を一瞬でコピー</span>
            <span>📂 月別自動整理で大量の書類もスッキリ管理</span>
            <span>☁️ クラウド同期でスマホ・PC・タブレットどこでも</span>
            <span>✨ 月額¥500で書類保存・テンプレートが無制限</span>
            <span>🔍 Proなら書類検索＆タイプフィルターが使える</span>
            <span>📋 書類の複製ワンタップ！先月の請求書を一瞬でコピー</span>
            <span>📂 月別自動整理で大量の書類もスッキリ管理</span>
            <span>☁️ クラウド同期でスマホ・PC・タブレットどこでも</span>
          </div>
        </div>
      )}
      {isPro && user && (
        <div className="pro-marquee-gold">
          <div className="pro-marquee-track">
            <span>⭐ DocuMint Pro をご利用いただきありがとうございます ⭐ 保存テンプレート・保存書類が無制限でご利用いただけます</span>
            <span>⭐ DocuMint Pro をご利用いただきありがとうございます ⭐ 保存テンプレート・保存書類が無制限でご利用いただけます</span>
            <span>⭐ DocuMint Pro をご利用いただきありがとうございます ⭐ 保存テンプレート・保存書類が無制限でご利用いただけます</span>
            <span>⭐ DocuMint Pro をご利用いただきありがとうございます ⭐ 保存テンプレート・保存書類が無制限でご利用いただけます</span>
          </div>
        </div>
      )}
      <div id="tour-doc-tabs" className="doc-type-tabs">
        {Object.entries(DOC_TYPE_LABELS).map(([k,v]) => <button key={k} className={`tab-btn ${doc.type===k?'active':''}`} onClick={() => { if(doc.type!==k) { setDocumentType(k); showToast(`📄 ${v}に切り替えました`); } }}>{v}</button>)}
      </div>
      <section className="toolbar-section">
        <div className="section-title">書類情報</div>
        <div className="form-group"><label className="form-label">件名</label><input className="input" placeholder="〇〇工事 代金など" value={doc.subject} onChange={e=>setDocument({subject:e.target.value})} /></div>
        {doc.type!=='receipt' ? (
          isNarrow ? (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              <div className="form-group" style={{minWidth:0,overflow:'hidden'}}><label className="form-label">発行日</label><input type="date" className="input" style={{WebkitAppearance:'none',maxWidth:'100%'}} value={doc.issueDate} onChange={e=>setDocument({issueDate:e.target.value})} /></div>
              <div className="form-group" style={{minWidth:0,overflow:'hidden'}}><label className="form-label">{doc.type==='invoice'?'支払期日':'見積有効期限'}</label><input type="date" className="input" style={{WebkitAppearance:'none',maxWidth:'100%'}} value={doc.dueDate} onChange={e=>setDocument({dueDate:e.target.value})} /></div>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              <div className="form-group" style={{minWidth:0}}><label className="form-label">発行日</label><input type="date" className="input" value={doc.issueDate} onChange={e=>setDocument({issueDate:e.target.value})} /></div>
              <div className="form-group" style={{minWidth:0}}><label className="form-label">{doc.type==='invoice'?'支払期日':'見積有効期限'}</label><input type="date" className="input" value={doc.dueDate} onChange={e=>setDocument({dueDate:e.target.value})} /></div>
            </div>
          )
        ) : (
          <div className="form-group" style={isNarrow?{overflow:'hidden'}:{}}><label className="form-label">発行日</label><input type="date" className="input" style={isNarrow?{WebkitAppearance:'none',maxWidth:'100%'}:{}} value={doc.issueDate} onChange={e=>setDocument({issueDate:e.target.value})} /></div>
        )}
        <div className="form-group"><label className="form-label">書類番号</label><input className="input" placeholder="T1234567890123" value={doc.number} onChange={e=>setDocument({number:e.target.value})} /></div>
      </section>
      <section className="toolbar-section">
        <div className="section-title">会社情報</div>
        <div className="info-cards">
          <div id="tour-my-company" className="info-card-row">
            <button className={`info-card ${myCompany.name?'filled':''}`} onClick={() => setActiveModal('myCompany')}><div className="info-card-label">自社情報</div><div className="info-card-value">{myCompany.name||'未設定（クリックして編集）'}</div></button>
            {(myCompany.name||myCompany.postalCode||myCompany.phone||myCompany.address) && <button className="btn btn-ghost btn-sm card-reset" onClick={() => { if(confirm('自社情報をリセットしますか？')) setMyCompany({name:'',postalCode:'',address:'',phone:'',fax:'',email:'',bankName:'',bankBranch:'',bankType:'普通',bankNumber:'',bankHolder:'',registrationNumber:''}); }}>🗑</button>}
          </div>
          <div id="tour-client" className="info-card-row">
            <button className={`info-card ${client.name?'filled':''}`} onClick={() => setActiveModal('client')}><div className="info-card-label">取引先</div><div className="info-card-value">{client.name||'未設定（クリックして編集）'}</div></button>
            {(client.name||client.postalCode||client.address) && <button className="btn btn-ghost btn-sm card-reset" onClick={() => { if(confirm('取引先情報をリセットしますか？')) setClient({name:'',postalCode:'',address:'',honorific:'御中'}); }}>🗑</button>}
          </div>
        </div>
      </section>
      <section id="tour-stamp" className="toolbar-section">
        <div className="section-title">角印</div>
        <StampUploader doc={doc} setStampImage={setStampImage} label="角印" icon="🔏" />
      </section>
      <section id="tour-logo" className="toolbar-section">
        <div className="section-title">ロゴ（フッター）</div>
        <StampUploader doc={doc} setStampImage={img => state.setLogoImage(img)} label="ロゴ" icon="🏢" />
      </section>
      <section id="tour-items" className="toolbar-section">
        <div className="section-title-row"><span className="section-title">明細</span><button className="btn btn-outline btn-sm" onClick={() => { addItem(); showToast('＋ 行を追加しました'); setTimeout(() => { const rows = document.querySelectorAll('.item-row'); if(rows.length) rows[rows.length-1].scrollIntoView({behavior:'smooth',block:'center'}); }, 100); }}>＋ 行追加</button></div>
        <ItemsEditor doc={doc} updateItem={updateItem} removeItem={removeItem} />
      </section>
      <section id="tour-totals" className="toolbar-section totals-section">
        <div className="total-row"><span>税別合計</span><span>{formatCurrency(subtotal)}</span></div>
        <div className="total-row"><span>消費税{(() => { const rates = [...new Set(doc.items.map(i=>i.taxRate))]; return rates.length===1 ? `（${rates[0]}%）` : ''; })()}</span><span>{formatCurrency(taxAmount)}</span></div>
        <div className="total-row grand"><span>合計金額</span><span>{formatCurrency(total)}</span></div>
      </section>
      <section id="tour-notes" className="toolbar-section">
        <div className="section-title">備考</div>
        <textarea className="input" rows={3} placeholder="振込手数料はご負担ください。など" value={doc.notes} onChange={e=>setDocument({notes:e.target.value})} style={{resize:'vertical'}} />
      </section>
      <div id="tour-history"><HistoryPanel templates={templates} saveTemplate={saveTemplate} loadTemplate={loadTemplate} deleteTemplate={deleteTemplate} savedDocs={savedDocs} saveDocument={saveDocument} loadDocument={loadDocument} deleteDoc={deleteDoc} duplicateDocument={duplicateDocument} doc={doc} onShowUpgrade={onShowUpgrade} isPro={isPro} showToast={showToast} /></div>
      <div id="tour-pdf" className="toolbar-actions">
        <button className="btn btn-primary" onClick={handlePDF} disabled={pdfLoading} style={{overflow:'hidden',textOverflow:'ellipsis',minWidth:0}}>{pdfLoading ? '⏳ PDF生成中...' : '📥 PDFダウンロード（印刷）'}</button>
        <div style={{textAlign:'center',padding:'8px 0',fontSize:12,color:'#888',lineHeight:1.5}}>🖨️ 印刷はダウンロードしたPDFから行えます</div>
        <div ref={panelRef} style={{marginTop:8}}>
          <button id="tour-conveni" onClick={() => { const n=!conveniOpen; setConveniOpen(n); if(n) setTimeout(()=>panelRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),50); }} style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'9px 14px',background:conveniOpen?'#f1f5f9':'#fff',border:'1px solid #cbd5e1',borderRadius:8,cursor:'pointer',fontSize:13,color:'#334155',fontWeight:500}}>
            <span>🏪</span><span>コンビニで印刷する方法</span>
            <span style={{marginLeft:'auto',fontSize:11,display:'inline-block',transform:conveniOpen?'rotate(180deg)':'rotate(0deg)',transition:'transform .2s'}}>▼</span>
          </button>
          {conveniOpen && (
            <div style={{marginTop:6,border:'1px solid #e2e8f0',borderRadius:10,overflow:'hidden',background:'#fff'}}>
              <div style={{display:'flex',borderBottom:'1px solid #e2e8f0'}}>
                {['seven','famima'].map(s => { const a=conveniStore===s; const sd=CONVENI[s]; return (
                  <button key={s} onClick={() => setConveniStore(s)} style={{flex:1,padding:'10px 8px',border:'none',borderBottom:a?`3px solid ${sd.color}`:'3px solid transparent',background:a?sd.bg:'#f8fafc',color:a?sd.color:'#64748b',fontWeight:a?700:400,fontSize:12,cursor:'pointer'}}>{sd.label}</button>
                ); })}
              </div>
              <div style={{padding:16}}>
                <div style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:cd.bg,border:`1px solid ${cd.border}`,borderRadius:8,marginBottom:14}}>
                  <span style={{fontSize:18}}>📱</span>
                  <div style={{minWidth:0,flex:1}}><div style={{fontSize:11,color:'#64748b',marginBottom:2}}>事前に専用アプリでPDFをアップロード</div><div style={{fontWeight:700,color:cd.color,fontSize:13}}>{cd.app}</div><div style={{display:'flex',gap:6,marginTop:6}}><a href={cd.appStore} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',background:'#000',color:'#fff',borderRadius:6,fontSize:10,fontWeight:600,textDecoration:'none',whiteSpace:'nowrap'}}>🍎 App Store</a><a href={cd.playStore} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',background:'#01875f',color:'#fff',borderRadius:6,fontSize:10,fontWeight:600,textDecoration:'none',whiteSpace:'nowrap'}}>▶ Google Play</a></div></div>
                </div>
                <div style={{fontSize:11,color:'#94a3b8',fontWeight:600,marginBottom:8}}>手順</div>
                <ol style={{listStyle:'none',padding:0,margin:0}}>
                  {cd.steps.map((step,i) => (
                    <li key={i} style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:9}}>
                      <span style={{flexShrink:0,width:20,height:20,borderRadius:'50%',background:cd.color,color:'#fff',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{i+1}</span>
                      <span style={{fontSize:12,color:'#374151',lineHeight:1.5,paddingTop:2}}>{step}</span>
                    </li>
                  ))}
                </ol>
                <div style={{marginTop:14,padding:'10px 12px',background:'#fefce8',border:'1px solid #fde68a',borderRadius:8}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#92400e',marginBottom:5}}>💡 ポイント</div>
                  <ul style={{margin:0,padding:'0 0 0 14px'}}>{cd.tips.map((t,i) => <li key={i} style={{fontSize:11,color:'#78350f',lineHeight:1.6}}>{t}</li>)}</ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
