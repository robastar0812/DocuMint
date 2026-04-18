import { useState } from 'react';
import { DOC_TYPE_LABELS } from '../lib/utils.js';

export default function HistoryPanel({ templates, saveTemplate, loadTemplate, deleteTemplate, savedDocs, saveDocument, loadDocument, deleteDoc, duplicateDocument, doc, onShowUpgrade, isPro, showToast }) {
  const FREE_LIMIT = 2;
  const [tab, setTab] = useState('docs');
  const [saveName, setSaveName] = useState('');
  const [mode, setMode] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [collapsed, setCollapsed] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(null);

  const handleSave = () => {
    if (!saveName.trim()) return;
    if (mode === 'saveDoc') {
      if (!isPro && savedDocs.length >= FREE_LIMIT) {
        setSaveName(''); setMode(null);
        onShowUpgrade && onShowUpgrade('doc');
        return;
      }
      if (savedDocs.some(d => d.name === saveName.trim())) {
        showToast('⚠️ 同じ名前の書類が既にあります');
        return;
      }
      saveDocument(saveName.trim());
      showToast('✅ 書類を保存しました');
      setSaveSuccess('✅ 保存しました！');
    }
    if (mode === 'saveTmpl') {
      if (!isPro && templates.length >= FREE_LIMIT) {
        setSaveName(''); setMode(null);
        onShowUpgrade && onShowUpgrade('template');
        return;
      }
      if (templates.some(t => t.name === saveName.trim())) {
        showToast('⚠️ 同じ名前のテンプレートが既にあります');
        return;
      }
      saveTemplate(saveName.trim());
      showToast('✅ テンプレートを保存しました');
      setSaveSuccess('✅ 保存しました！');
    }
    setSaveName(''); setMode(null);
    setTimeout(() => setSaveSuccess(null), 2000);
  };

  const handleDuplicate = id => {
    if (!isPro && savedDocs.length >= FREE_LIMIT) {
      onShowUpgrade && onShowUpgrade('doc');
      return;
    }
    duplicateDocument(id);
    showToast('📄 書類を複製しました');
  };

  const fmtDate = iso => { const d=new Date(iso); return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`; };
  const getMonthLabel = iso => { const d=new Date(iso); return `${d.getFullYear()}年${d.getMonth()+1}月`; };

  const filteredDocs = [...savedDocs].reverse().filter(d => {
    if (typeFilter !== 'all' && d.type !== typeFilter) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredTemplates = [...templates].reverse().filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const groupByMonth = items => {
    const groups = {};
    items.forEach(item => {
      const key = getMonthLabel(item.savedAt || item.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  };

  const toggleMonth = key => setCollapsed(p => ({...p, [key]: !p[key]}));

  return (
    <div className="history-panel">
      <div className="history-tabs" style={{background:'var(--color-surface)'}}>
        <button className={`htab ${tab==='docs'?'active':''}`} onClick={() => { setTab('docs'); setSearch(''); setTypeFilter('all'); }}>
          📂 保存書類 {savedDocs.length > 0 && <span className="badge">{savedDocs.length}</span>}
        </button>
        <button className={`htab ${tab==='templates'?'active':''}`} onClick={() => { setTab('templates'); setSearch(''); }}>
          📋 保存テンプレート {templates.length > 0 && <span className="badge">{templates.length}</span>}
        </button>
      </div>
      <div className="history-save-area">
        {saveSuccess && (
          <div style={{padding:'10px 16px',background:'#e8f5e9',border:'1px solid #a5d6a7',borderRadius:8,marginBottom:10,textAlign:'center',fontSize:14,fontWeight:700,color:'#2e7d32',animation:'fadeIn .3s ease-out'}}>
            {saveSuccess}
          </div>
        )}
        {mode ? (
          <div className="save-input-row">
            <input className="input" style={{minWidth:0}} placeholder={mode==='saveDoc'?'書類名を入力':'テンプレート名を入力'} value={saveName} onChange={e=>setSaveName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSave()} autoFocus />
            <button className="btn btn-primary btn-sm" onClick={handleSave}>保存</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setMode(null); setSaveName(''); }}>✕</button>
          </div>
        ) : (
          <div className="save-btns">
            <button className="btn btn-outline btn-sm" onClick={() => { setMode('saveDoc'); setTab('docs'); }}
              style={{position:'relative'}}>
              💾 書類を保存
              {!isPro && <span style={{marginLeft:6,fontSize:10,color:savedDocs.length>=FREE_LIMIT?'#c0392b':'#27ae60',fontWeight:700}}>
                {savedDocs.length}/{FREE_LIMIT}
              </span>}
              {isPro && <span style={{marginLeft:6,fontSize:10,color:'#6c3fd4',fontWeight:700}}>Pro</span>}
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => { setMode('saveTmpl'); setTab('templates'); }}
              style={{position:'relative'}}>
              ＋ テンプレートを保存
              {!isPro && <span style={{marginLeft:6,fontSize:10,color:templates.length>=FREE_LIMIT?'#c0392b':'#27ae60',fontWeight:700}}>
                {templates.length}/{FREE_LIMIT}
              </span>}
              {isPro && <span style={{marginLeft:6,fontSize:10,color:'#6c3fd4',fontWeight:700}}>Pro</span>}
            </button>
          </div>
        )}
      </div>
      {((tab==='docs' && savedDocs.length >= 3) || (tab==='templates' && templates.length >= 3)) && (
        <div style={{padding:'8px 16px',borderBottom:'1px solid var(--color-border)'}}>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <div style={{flex:1,position:'relative'}}>
              <input className="input" placeholder={tab==='docs'?'🔍 書類名で検索':'🔍 テンプレート名で検索'} value={search} onChange={e=>setSearch(e.target.value)} style={{fontSize:12,padding:'6px 10px',paddingRight:search?28:10,width:'100%'}} />
              {search && <button onClick={() => { setSearch(''); showToast('🔍 検索をクリアしました'); }} style={{position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',fontSize:14,color:'#999',cursor:'pointer',padding:'2px',lineHeight:1}}>✕</button>}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => { document.activeElement.blur(); const count = tab==='docs' ? filteredDocs.length : filteredTemplates.length; showToast(search ? `🔍 ${count}件見つかりました` : `📂 全${count}件を表示中`); }} style={{whiteSpace:'nowrap',padding:'6px 12px',fontSize:12}}>検索</button>
          </div>
        </div>
      )}
      {tab==='docs' && savedDocs.length >= 3 && (
        <div style={{padding:'6px 16px',borderBottom:'1px solid var(--color-border)',display:'flex',gap:4,flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontSize:11,fontWeight:700,color:'var(--color-text-muted)',marginRight:4}}>絞り込み</span>
          {[['all','全て'],['invoice','請求書'],['receipt','領収書'],['estimate','見積書']].map(([k,v]) => (
            <button key={k} onClick={() => setTypeFilter(k)} style={{padding:'3px 10px',borderRadius:99,border:'1px solid',borderColor:typeFilter===k?'var(--color-primary)':'var(--color-border)',background:typeFilter===k?'var(--color-primary)':'transparent',color:typeFilter===k?'white':'var(--color-text-muted)',fontSize:11,fontWeight:typeFilter===k?700:400,cursor:'pointer',fontFamily:'var(--font-sans)'}}>{v}</button>
          ))}
        </div>
      )}
      {tab === 'docs' && (
        <div className="history-list">
          {savedDocs.length === 0 ? <div className="history-empty">保存した書類はありません</div> :
           filteredDocs.length === 0 ? <div className="history-empty">該当する書類はありません</div> :
            savedDocs.length >= 5 ? Object.entries(groupByMonth(filteredDocs)).map(([month, items]) => (
              <div key={month}>
                <button onClick={() => toggleMonth(month)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',padding:'8px 16px',border:'none',borderBottom:'1px solid var(--color-border)',background:'var(--color-surface)',cursor:'pointer',fontFamily:'var(--font-sans)',fontSize:11,fontWeight:700,color:'var(--color-text-muted)',letterSpacing:'.04em'}}>
                  <span>{month}（{items.length}件）</span>
                  <span style={{fontSize:10,transform:collapsed[month]?'rotate(0deg)':'rotate(180deg)',transition:'transform .2s'}}>▼</span>
                </button>
                {!collapsed[month] && items.map(d => (
                  <div key={d.id} className="history-item">
                    <div className="history-item-info" style={{minWidth:0,overflow:"hidden"}}>
                      <div className="history-item-name">{d.name}</div>
                      <div className="history-item-meta">{DOC_TYPE_LABELS[d.type]} · {fmtDate(d.savedAt)}</div>
                    </div>
                    <div className="history-item-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => { if(confirm('この書類を開きますか？\n現在の入力内容は上書きされます。')) { loadDocument(d.id); showToast('📂 書類を開きました'); } }}>開く</button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleDuplicate(d.id)}>📄複製</button>
                      <button className="btn btn-ghost btn-sm del" onClick={() => { if(confirm('この書類を削除しますか？\nこの操作は取り消せません。')) { deleteDoc(d.id); showToast('🗑 書類を削除しました'); } }}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )) : filteredDocs.map(d => (
              <div key={d.id} className="history-item">
                <div className="history-item-info" style={{minWidth:0,overflow:"hidden"}}>
                  <div className="history-item-name">{d.name}</div>
                  <div className="history-item-meta">{DOC_TYPE_LABELS[d.type]} · {fmtDate(d.savedAt)}</div>
                </div>
                <div className="history-item-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => { if(confirm('この書類を開きますか？\n現在の入力内容は上書きされます。')) { loadDocument(d.id); showToast('📂 書類を開きました'); } }}>開く</button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleDuplicate(d.id)}>📄複製</button>
                  <button className="btn btn-ghost btn-sm del" onClick={() => { if(confirm('この書類を削除しますか？\nこの操作は取り消せません。')) { deleteDoc(d.id); showToast('🗑 書類を削除しました'); } }}>🗑</button>
                </div>
              </div>
            ))
          }
        </div>
      )}
      {tab === 'templates' && (
        <div className="history-list">
          {templates.length === 0 ? <div className="history-empty">保存したテンプレートはありません</div> :
           filteredTemplates.length === 0 ? <div className="history-empty">該当するテンプレートはありません</div> :
            filteredTemplates.map(t => (
              <div key={t.id} className="history-item">
                <div className="history-item-info" style={{minWidth:0,overflow:"hidden"}}>
                  <div className="history-item-name">{t.name}</div>
                  <div className="history-item-meta">{t.items.length}行 · {fmtDate(t.createdAt)}</div>
                </div>
                <div className="history-item-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => { if(confirm('このテンプレートを適用しますか？\n現在の明細内容が上書きされます。')) { loadTemplate(t.id); showToast('📋 テンプレートを適用しました'); } }}>適用</button>
                  <button className="btn btn-ghost btn-sm del" onClick={() => { if(confirm('このテンプレートを削除しますか？\nこの操作は取り消せません。')) { deleteTemplate(t.id); showToast('🗑 テンプレートを削除しました'); } }}>🗑</button>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
