import { useState, useEffect } from 'react';
import { TOUR_STEPS } from '../lib/tourSteps.js';

export default function TourOverlay({ step, total, onNext, onPrev, onEnd }) {
  const [pos, setPos] = useState(null);
  const current = TOUR_STEPS[step];

  const getScrollParent = (el) => {
    let node = el.parentElement;
    while (node) {
      const style = window.getComputedStyle(node);
      const overflow = style.overflowY;
      if ((overflow === 'auto' || overflow === 'scroll') && node.scrollHeight > node.clientHeight) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  };

  useEffect(() => {
    setPos(null);
    const el = document.getElementById(current.id);
    if (!el) { step < total - 1 ? onNext() : onEnd(); return; }

    const sc = getScrollParent(el);
    if (sc) {
      const scRect = sc.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const elRelTop = elRect.top - scRect.top + sc.scrollTop;
      const targetTop = elRelTop - sc.clientHeight / 2 + elRect.height / 2;
      sc.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const timer = setTimeout(() => {
      const r = el.getBoundingClientRect();
      const pad = 8;
      const ww = window.innerWidth;
      const wh = window.innerHeight;
      const TOOLTIP_H = 230;
      const tw = ww <= 768 ? ww - 24 : Math.min(300, ww - 24);

      const box = {
        top: r.top - pad,
        left: r.left - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      };

      const sidebar = document.querySelector('.sidebar');
      const sidebarW = sidebar ? sidebar.getBoundingClientRect().width : 320;
      const isMobile = ww <= 768;
      const isInSidebar = r.left < sidebarW;

      let tLeft, tTop;

      if (isMobile) {
        tLeft = 12;
        tTop = wh - TOOLTIP_H - 20;
      } else if (isInSidebar) {
        const previewAreaLeft = sidebarW + 16;
        const previewAreaWidth = ww - sidebarW - 32;
        tLeft = previewAreaLeft + (previewAreaWidth - tw) / 2;
        tLeft = Math.max(previewAreaLeft, Math.min(tLeft, ww - tw - 12));
        tTop = Math.max(16, (wh - TOOLTIP_H) / 2 - 40);
      } else {
        tLeft = Math.max(sidebarW + 12, Math.min(r.left + r.width/2 - tw/2, ww - tw - 12));
        const spaceBelow = wh - (r.bottom + pad + 12);
        const spaceAbove = r.top - pad - 12;
        if (spaceBelow >= TOOLTIP_H) {
          tTop = r.bottom + pad + 12;
        } else if (spaceAbove >= TOOLTIP_H) {
          tTop = r.top - pad - TOOLTIP_H - 4;
        } else {
          tTop = Math.max(12, (wh - TOOLTIP_H) / 2);
        }
      }

      setPos({ box, tooltip: { left: tLeft, top: tTop, width: tw } });
    }, 600);
    return () => clearTimeout(timer);
  }, [step]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <div style={{ position: 'absolute', inset: 0 }} onClick={onEnd} />

      {pos && <>
        <div style={{ position:'absolute', top:0, left:0, right:0, height: Math.max(0, pos.box.top), background:'rgba(0,0,0,0.7)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top: pos.box.top + pos.box.height, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top: pos.box.top, left:0, width: Math.max(0, pos.box.left), height: pos.box.height, background:'rgba(0,0,0,0.7)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top: pos.box.top, left: pos.box.left + pos.box.width, right:0, height: pos.box.height, background:'rgba(0,0,0,0.7)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top: pos.box.top, left: pos.box.left, width: pos.box.width, height: pos.box.height, border:'2.5px solid #f59e0b', borderRadius:10, boxShadow:'0 0 0 4px rgba(245,158,11,0.25)', pointerEvents:'none' }} />
      </>}

      {!pos && (
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', color:'white', fontSize:14, pointerEvents:'none' }}>
          読み込み中...
        </div>
      )}

      {pos && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: pos.tooltip.left,
            top: pos.tooltip.top,
            width: pos.tooltip.width,
            background: 'white',
            borderRadius: 14,
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            padding: '14px 14px 12px',
            zIndex: 10000,
          }}
        >
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8, gap:8 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#1a2744', lineHeight:1.3 }}>{current.title}</div>
            <button onClick={onEnd} style={{ border:'none', background:'rgba(0,0,0,0.07)', cursor:'pointer', fontSize:12, color:'#555', padding:'3px 8px', borderRadius:6, flexShrink:0, whiteSpace:'nowrap' }}>✕ 閉じる</button>
          </div>
          <div style={{ fontSize:12, color:'#444', lineHeight:1.65, marginBottom:12 }}>{current.desc}</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:11, color:'#aaa', fontWeight:600 }}>{step + 1} / {total}</span>
            <div style={{ display:'flex', gap:6 }}>
              {step > 0 && (
                <button onClick={onPrev} style={{ padding:'6px 12px', border:'1.5px solid #d1d5db', borderRadius:7, background:'white', fontSize:12, cursor:'pointer', color:'#555', fontWeight:500 }}>← 前へ</button>
              )}
              {step < total - 1 ? (
                <button onClick={onNext} style={{ padding:'6px 14px', border:'none', borderRadius:7, background:'linear-gradient(90deg,#6c3fd4,#2d7cf6)', fontSize:12, cursor:'pointer', color:'white', fontWeight:700 }}>次へ →</button>
              ) : (
                <button onClick={onEnd} style={{ padding:'6px 14px', border:'none', borderRadius:7, background:'#27ae60', fontSize:12, cursor:'pointer', color:'white', fontWeight:700 }}>✅ 完了！</button>
              )}
            </div>
          </div>
          <div style={{ marginTop:10, height:3, background:'#e5e7eb', borderRadius:3 }}>
            <div style={{ height:3, borderRadius:3, background:'linear-gradient(90deg,#6c3fd4,#2d7cf6)', width:`${((step+1)/total)*100}%`, transition:'width .35s ease' }} />
          </div>
        </div>
      )}
    </div>
  );
}
