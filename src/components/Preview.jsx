import { useState, useEffect, useRef, useCallback } from 'react';
import { calcTax, formatCurrency, formatDate, DOC_TYPE_LABELS } from '../lib/utils.js';

export default function Preview({ state }) {
  const { doc, myCompany, client, setStampPosition, setLogoPosition, docSettings } = state;

  useEffect(() => {
    const updateScale = () => {
      const vw = window.innerWidth;
      if (vw <= 768) {
        const scale = Math.min(0.95, (vw - 16) / 794);
        document.documentElement.style.setProperty('--a4-scale', scale.toFixed(3));
      } else {
        document.documentElement.style.removeProperty('--a4-scale');
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);
  const { subtotal, taxAmount, total } = calcTax(doc.items);
  const stampRef = useRef(null), logoRef = useRef(null), previewRef = useRef(null);
  const [dragging, setDragging] = useState(false), [logoDragging, setLogoDragging] = useState(false);
  const dragOffset = useRef({x:0,y:0}), logoDragOffset = useRef({x:0,y:0});

  const th = docSettings?.tableHeader||'#ffffff';
  const ab = docSettings?.amountBox||'#ffffff';
  const tb = docSettings?.totalBar||'#ffffff';
  const font = docSettings?.docFont||"'Noto Serif JP', serif";
  const isMono = th==='#ffffff';
  const tc = isMono?'#1a1a1a':'white';
  const bs = isMono?'1.5px solid #1a1a1a':'none';

  const makeDrag = (setDrag, setPos, offset) => useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(true);
    const touch = e.touches ? e.touches[0] : e;
    const rect = e.currentTarget.getBoundingClientRect();
    offset.current = {x: touch.clientX - rect.left, y: touch.clientY - rect.top};

    const getPos = ev => {
      const t = ev.touches ? ev.touches[0] : ev;
      const pr = previewRef.current?.getBoundingClientRect();
      if (!pr) return null;
      const scaleX = pr.width / previewRef.current.offsetWidth;
      const scaleY = pr.height / previewRef.current.offsetHeight;
      const adjustedOffsetX = offset.current.x * scaleX;
      const adjustedOffsetY = offset.current.y * scaleY;
      return {
        x: Math.max(0, Math.min(85, ((t.clientX - pr.left - adjustedOffsetX) / pr.width) * 100)),
        y: Math.max(0, Math.min(92, ((t.clientY - pr.top - adjustedOffsetY) / pr.height) * 100)),
      };
    };

    const onMove = ev => { ev.preventDefault(); const p = getPos(ev); if(p) setPos(p); };
    const onUp = () => {
      setDrag(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, {passive: false});
    window.addEventListener('touchend', onUp);
  }, [setPos]);

  const handleStampMouseDown = makeDrag(setDragging, setStampPosition, dragOffset);
  const handleLogoMouseDown = makeDrag(setLogoDragging, setLogoPosition, logoDragOffset);
  const label = DOC_TYPE_LABELS[doc.type];

  return (
    <div className="preview-wrapper">
      <div className="preview-label">{label} プレビュー</div>
      <div id="a4-preview" ref={previewRef} className="a4-paper" style={{fontFamily:font}}>
        <div className="doc-header">
          <h1 className="doc-title">{label}</h1>
          <div className="doc-meta">
            {doc.number && <div className="doc-meta-row">書類番号：{doc.number}</div>}
            <div className="doc-meta-row">発行日：{formatDate(doc.issueDate)}</div>
            {doc.dueDate && <div className="doc-meta-row">{doc.type==='invoice'?'支払期日':'有効期限'}：{formatDate(doc.dueDate)}</div>}
          </div>
        </div>
        <div className="doc-parties">
          <div className="doc-client">
            {client.postalCode && <div className="doc-postal">〒{client.postalCode}</div>}
            {client.address && <div className="doc-address">{client.address}</div>}
            <div className="doc-client-name">{client.name||'取引先名'}<span className="doc-honorific">{client.honorific}</span></div>
            {doc.subject && <div className="doc-subject">件名：<strong>{doc.subject}</strong></div>}
            <div className="doc-total-box" style={{background:ab,border:bs,color:tc}}>
              <span className="doc-total-label" style={{color:tc}}>{doc.type==='receipt'?'お支払い金額':'請求金額'}</span>
              <span className="doc-total-amount" style={{color:tc}}>{formatCurrency(total)}</span>
              <span className="doc-total-tax" style={{color:isMono?'#555':'rgba(255,255,255,0.65)'}}>（うち消費税 {formatCurrency(taxAmount)}）</span>
            </div>
          </div>
          <div className="doc-mycompany">
            <div className="doc-mycompany-name">{myCompany.name||'会社名'}</div>
            {myCompany.postalCode && <div className="doc-mycompany-info">〒{myCompany.postalCode}</div>}
            {myCompany.address && <div className="doc-mycompany-info">{myCompany.address}</div>}
            {myCompany.phone && <div className="doc-mycompany-info">TEL: {myCompany.phone}</div>}
            {myCompany.fax && <div className="doc-mycompany-info">FAX: {myCompany.fax}</div>}
            {myCompany.email && <div className="doc-mycompany-info">{myCompany.email}</div>}
            {myCompany.registrationNumber && <div className="doc-mycompany-info registration">登録番号：{myCompany.registrationNumber}</div>}
          </div>
        </div>
        <table className="doc-table">
          <thead>
            <tr style={{background:th,border:bs}}>
              {['品目・内容','数量','単位','単価','税','金額'].map(h => <th key={h} className={`col-${h==='品目・内容'?'name':h==='数量'?'qty':h==='単位'?'unit':h==='単価'?'price':h==='税'?'tax':'total'}`} style={{color:tc}}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {doc.items.filter(i=>i.name||i.unitPrice).map((item,idx) => (
              <tr key={item.id} className={idx%2===0?'row-even':'row-odd'}>
                <td className="col-name">{item.name||'—'}</td>
                <td className="col-qty">{item.quantity}</td>
                <td className="col-unit">{item.unit}</td>
                <td className="col-price">{formatCurrency(item.unitPrice)}</td>
                <td className="col-tax">{item.taxType==='inclusive'?'込':'別'} {item.taxRate}%</td>
                <td className="col-total">{formatCurrency(item.quantity*item.unitPrice)}</td>
              </tr>
            ))}
            {Array.from({length:Math.max(0,5-doc.items.filter(i=>i.name||i.unitPrice).length)}).map((_,i) => (
              <tr key={`e${i}`} className={i%2===0?'row-even':'row-odd'}><td className="col-name">&nbsp;</td><td/><td/><td/><td/><td/></tr>
            ))}
          </tbody>
        </table>
        <div className="doc-totals">
          <div className="doc-total-row"><span>小計（税別合計）</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="doc-total-row"><span>消費税</span><span>{formatCurrency(taxAmount)}</span></div>
          <div className="doc-total-row grand" style={{background:tb,border:bs,color:tc}}><span>合計金額</span><span>{formatCurrency(total)}</span></div>
        </div>
        {doc.type==='invoice' && myCompany.bankName && (
          <div className="doc-bank">
            <div className="doc-bank-title">お振込先</div>
            <div className="doc-bank-info">{myCompany.bankName}{myCompany.bankName&&!myCompany.bankName.endsWith('銀行')&&!myCompany.bankName.endsWith('信用金庫')&&!myCompany.bankName.endsWith('信金')&&!myCompany.bankName.endsWith('組合')?'銀行':''} {myCompany.bankBranch}{myCompany.bankBranch&&!myCompany.bankBranch.endsWith('支店')?'支店':''}　{myCompany.bankType}　　{myCompany.bankNumber}　　口座名義：{myCompany.bankHolder}</div>
          </div>
        )}
        {doc.notes && <div className="doc-notes"><div className="doc-notes-title">備考</div><div className="doc-notes-body">{doc.notes}</div></div>}
        {doc.stampImage && <img ref={stampRef} src={doc.stampImage} alt="角印" className={`doc-stamp ${dragging?'dragging':''}`} style={{left:`${doc.stampPosition.x}%`,top:`${doc.stampPosition.y}%`}} onMouseDown={handleStampMouseDown} onTouchStart={handleStampMouseDown} />}
        {doc.logoImage && doc.logoPosition && <img ref={logoRef} src={doc.logoImage} alt="ロゴ" className={`doc-stamp ${logoDragging?'dragging':''}`} style={{left:`${doc.logoPosition?.x??10}%`,top:`${doc.logoPosition?.y??90}%`,width:'120px',height:'auto'}} onMouseDown={handleLogoMouseDown} onTouchStart={handleLogoMouseDown} />}
      </div>
    </div>
  );
}
