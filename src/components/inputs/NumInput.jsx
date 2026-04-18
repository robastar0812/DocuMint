import { useState } from 'react';
import { toComma, fromComma, toQtyStr, fromQty } from '../../lib/utils.js';

export default function NumInput({ value, onChange, placeholder='0', step=1, isFloat=false }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');
  const handleFocus = (e) => { const el = e.target; setEditing(true); setRaw(isFloat ? toQtyStr(value) : toComma(value)); setTimeout(() => { try { el.select(); } catch(ex){} }, 50); };
  const handleBlur = () => { setEditing(false); onChange(isFloat ? fromQty(raw) : fromComma(raw)); };
  const handleChange = e => setRaw(e.target.value.replace(/[^0-9.,]/g,''));
  return (
    <input
      className="input"
      type="text"
      inputMode={isFloat ? 'decimal' : 'numeric'}
      value={editing ? raw : (isFloat ? (value===0?'':String(value)) : (value===0?'':value.toLocaleString('ja-JP')))}
      placeholder={placeholder}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
    />
  );
}
