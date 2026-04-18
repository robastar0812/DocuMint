import { useState } from 'react';
import { lookupPostal } from '../../lib/utils.js';

export default function PostalInput({ value, onChange, onAddressFound }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleChange = e => {
    let v = e.target.value;
    v = v.replace(/[\uFF10-\uFF19]/g, function(c){ return String.fromCharCode(c.charCodeAt(0) - 65248); });
    v = v.replace(/[^0-9\-]/g, '');
    var d = v.replace(/[^0-9]/g, '');
    if (d.length > 7) return;
    onChange(v);
    setMsg('');
  };

  const doSearch = function(val) {
    var digits = val.replace(/[^0-9]/g, '');
    if (digits.length !== 7) { setMsg('\u274C 7桁の郵便番号を入力してください'); return; }
    var fmt = digits.slice(0,3) + '-' + digits.slice(3);
    onChange(fmt);
    setLoading(true);
    setMsg('');
    lookupPostal(digits,
      function(addr) { setLoading(false); onAddressFound(addr); setMsg('\u2705 住所を自動入力しました'); },
      function() { setLoading(false); setMsg('\u274C 住所が見つかりませんでした'); }
    );
  };

  const handleBlur = e => {
    var digits = e.target.value.replace(/[^0-9]/g, '');
    if (digits.length === 7) doSearch(e.target.value);
  };

  return (
    <div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <input
          className="input"
          type="text"
          inputMode="numeric"
          placeholder="000-0000"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{flex:1}}
        />
        <button type="button" className="btn btn-outline btn-sm"
          onClick={() => doSearch(value)}
          disabled={loading}
          style={{whiteSpace:'nowrap',flexShrink:0}}>
          {loading ? '検索中…' : '住所検索'}
        </button>
      </div>
      {msg && <div style={{fontSize:11,marginTop:4,color:msg.startsWith('\u2705')?'#27ae60':'#c0392b'}}>{msg}</div>}
    </div>
  );
}
