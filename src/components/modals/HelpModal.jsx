import { useState, useEffect, useRef } from 'react';

export default function HelpModal({ onClose }) {
  const SECTIONS = [
    {id:'basic',title:'📄 書類を作成する',content:[
      {step:'① 書類の種類を選ぶ',desc:'画面上部のタブから「請求書」「領収書」「見積書」を選択します。',detail:'書類の種類によって表示項目が自動的に切り替わります。'},
      {step:'② 書類情報を入力する',desc:'件名・書類番号・発行日・支払期日を入力します。',detail:'書類番号は「INV-001」のように自由に設定できます。発行日は今日の日付が自動入力されます。'},
      {step:'③ 会社情報を設定する',desc:'「自社情報」と「取引先」をクリックして入力します。',detail:'一度入力すると次回から自動で表示されます。🗑ボタンで削除できます。'},
    ]},
    {id:'items',title:'📝 明細を入力する',content:[
      {step:'① 品目・作業内容を入力',desc:'明細エリアの入力欄に品目名を入力します。',detail:'「＋ 行追加」ボタンで明細行を増やせます。×ボタンで行を削除できます。'},
      {step:'② 数量・単位・単価を入力',desc:'数量・単位（式/個/時間など）・単価を入力します。',detail:'金額は数量×単価で自動計算されます。'},
      {step:'③ 税設定を選ぶ',desc:'「税別」または「税込」をプルダウンで選択し、税率を設定します。',detail:'税別合計・消費税・合計金額が自動で計算されます。'},
    ]},
    {id:'stamp',title:'🔏 角印・ロゴを設置する',content:[
      {step:'① 角印をアップロード',desc:'「角印」エリアに画像をドラッグ＆ドロップするか、クリックして選択します。',detail:'PNG形式（透過背景）を推奨します。プレビュー上でドラッグして位置を調整できます。'},
      {step:'② ロゴをアップロード',desc:'「ロゴ（フッター）」エリアに画像をドラッグ＆ドロップします。',detail:'角印と同様にプレビュー上でドラッグして位置を自由に調整できます。'},
    ]},
    {id:'design',title:'🎨 デザインをカスタマイズする',content:[
      {step:'① デザイン設定を開く',desc:'画面左上の「🎨 デザイン」ボタンをクリックします。',detail:'テーブルヘッダー・請求金額ボックス・合計エリアの色とフォントを変更できます。'},
      {step:'② カラーを選ぶ',desc:'プリセットから選ぶか、カラーピッカーで自由に色を設定します。',detail:'モノクロ・紺・グリーン・ネイビー・ブラウン・ブラックから選べます。'},
      {step:'③ フォントを選ぶ',desc:'明朝体・ゴシック体・システムフォントから選択します。',detail:'「適用する」ボタンを押すとリアルタイムでプレビューに反映されます。'},
    ]},
    {id:'save',title:'💾 書類を保存・管理する',content:[
      {step:'① 書類を保存する',desc:'「💾 書類を保存」ボタンをクリックします。',detail:'書類名を入力してEnterキーまたは「保存」ボタンを押します。保存が完了すると「✅ 書類を保存しました」のトースト通知が画面上部に表示されます。'},
      {step:'② 書類を開く',desc:'保存書類の「開く」ボタンをクリックします。',detail:'現在の入力内容が上書きされるため確認ダイアログが表示されます。「OK」を押すと書類が読み込まれます。'},
      {step:'③ 書類を複製する',desc:'保存書類の「📄複製」ボタンをクリックします。',detail:'同じ内容の書類が「（コピー）」付きで複製されます。先月の請求書を流用したい時に便利です。'},
      {step:'④ 保存テンプレートを使う',desc:'「＋ テンプレートを保存」ボタンで明細パターンを保存できます。',detail:'テンプレートの「適用」ボタンで明細が読み込まれます。適用時は確認ダイアログが表示されます。'},
      {step:'⑤ 新規書類を作成する',desc:'画面左上の「＋ 新規」ボタンをクリックします。',detail:'現在の入力内容がリセットされます。保存していない書類は消えますのでご注意ください。'},
      {step:'⑥ 検索・フィルター（有料プラン）',desc:'書類が3件以上になると検索バーと「検索」ボタンが表示されます。',detail:'書類名で検索できます。検索欄の✕ボタンで検索をクリアできます。タイプフィルターで請求書・領収書・見積書を絞り込めます。5件以上で月別グループ表示になります。'},
    ]},
    {id:'output',title:'📥 PDF・印刷・コンビニ印刷',content:[
      {step:'① PDFダウンロード',desc:'入力画面の「📥 PDFダウンロード」ボタンをクリックします。',detail:'A4サイズのPDFファイルがダウンロードされます。スマホではプレビュー画面の下部バー「📥 PDF」ボタンからも保存できます。'},
      {step:'② 印刷する',desc:'「📥 PDFダウンロード（印刷）」ボタンでPDFを保存します。',detail:'ダウンロードしたPDFファイルを開いて印刷してください。URL・日付が入らないクリーンな書類が印刷できます。スマホではプレビュー画面の下部バー「📥 PDF（印刷）」ボタンからも保存できます。'},
      {step:'③ コンビニで印刷する',desc:'「🏪 コンビニで印刷する方法」ボタンをクリックします。',detail:'セブン・ファミマ・ローソンでの印刷手順が表示されます。'},
    ]},
  ];
  const [activeSection, setActiveSection] = useState('basic');
  const contentRef = useRef(null);
  const tabsRef = useRef(null);
  const section = SECTIONS.find(s=>s.id===activeSection);
  const idx = SECTIONS.findIndex(s=>s.id===activeSection);
  const changeSec = id => { setActiveSection(id); if(contentRef.current) contentRef.current.scrollTop=0; };
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => {
    if (isMobile && tabsRef.current) {
      const activeBtn = tabsRef.current.querySelector('[data-active="true"]');
      if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeSection, isMobile]);

  return (
    <div className="modal-overlay" style={isMobile?{padding:0}:{}} onMouseDown={e=>{if(e.target===e.currentTarget)e.currentTarget._closeOnUp=true;}}
        onMouseUp={e=>{if(e.currentTarget._closeOnUp&&e.target===e.currentTarget){e.currentTarget._closeOnUp=false;onClose();}}}>
      <div className="modal-box" style={{maxWidth:isMobile?'100vw':680,width:isMobile?'100vw':'95vw',maxHeight:isMobile?'100vh':'90vh',borderRadius:isMobile?0:'var(--radius-xl)'}}>
        <div className="modal-header"><div className="modal-title">📖 操作説明</div><button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button></div>
        {isMobile && (
          <div ref={tabsRef} style={{display:'flex',overflowX:'auto',borderBottom:'1px solid var(--color-border)',background:'var(--color-surface)',WebkitOverflowScrolling:'touch',scrollbarWidth:'none',msOverflowStyle:'none'}}>
            {SECTIONS.map(s => (
              <button key={s.id} data-active={activeSection===s.id?'true':'false'} onClick={() => changeSec(s.id)} style={{padding:'10px 14px',border:'none',borderBottom:activeSection===s.id?'2px solid var(--color-primary)':'2px solid transparent',background:'transparent',color:activeSection===s.id?'var(--color-primary)':'var(--color-text-muted)',fontFamily:'var(--font-sans)',fontSize:12,fontWeight:activeSection===s.id?700:400,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>{s.title.replace(/^[^\s]+\s/,'')}</button>
            ))}
          </div>
        )}
        <div style={{display:'flex',maxHeight:isMobile?'calc(100vh - 110px)':'70vh',flexDirection:isMobile?'column':'row'}}>
          {!isMobile && (
            <div style={{width:190,minWidth:190,borderRight:'1px solid var(--color-border)',overflowY:'auto',background:'var(--color-surface)'}}>
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => changeSec(s.id)} style={{display:'block',width:'100%',textAlign:'left',padding:'12px 16px',border:'none',borderLeft:activeSection===s.id?'3px solid var(--color-primary)':'3px solid transparent',background:activeSection===s.id?'white':'transparent',color:activeSection===s.id?'var(--color-primary)':'var(--color-text-muted)',fontFamily:'var(--font-sans)',fontSize:12,fontWeight:activeSection===s.id?700:400,cursor:'pointer',lineHeight:1.4}}>{s.title}</button>
              ))}
            </div>
          )}
          <div ref={contentRef} style={{flex:1,overflowY:'auto',padding:isMobile?'16px':'20px 24px'}}>
            <div style={{fontSize:isMobile?14:15,fontWeight:700,color:'var(--color-primary)',marginBottom:isMobile?16:20,paddingBottom:12,borderBottom:'2px solid var(--color-border)'}}>{section?.title}</div>
            {section?.content.map((item, i) => (
              <div key={i} style={{marginBottom:isMobile?14:20,padding:isMobile?12:16,background:'var(--color-surface)',borderRadius:10,border:'1px solid var(--color-border)'}}>
                <div style={{fontSize:13,fontWeight:700,color:'var(--color-primary)',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                  <span style={{background:'var(--color-primary)',color:'white',borderRadius:'50%',width:22,height:22,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</span>
                  {item.step}
                </div>
                <div style={{fontSize:13,color:'var(--color-text)',marginBottom:8,lineHeight:1.6}}>{item.desc}</div>
                <div style={{fontSize:12,color:'var(--color-text-muted)',lineHeight:1.6,padding:'8px 12px',background:'white',borderRadius:6,borderLeft:'3px solid var(--color-border-dark)'}}>💡 {item.detail}</div>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:isMobile?16:24,paddingTop:isMobile?12:16,borderTop:'1px solid var(--color-border)'}}>
              <button className="btn btn-outline" onClick={() => idx>0&&changeSec(SECTIONS[idx-1].id)} disabled={idx===0} style={{opacity:idx===0?.3:1}}>← 前の項目</button>
              <span style={{fontSize:12,color:'var(--color-text-muted)'}}>{idx+1} / {SECTIONS.length}</span>
              <button className="btn btn-primary" onClick={idx===SECTIONS.length-1?onClose:()=>changeSec(SECTIONS[idx+1].id)}>{idx===SECTIONS.length-1?'閉じる':'次の項目 →'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
