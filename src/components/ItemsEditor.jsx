import NumInput from './inputs/NumInput.jsx';
import { formatCurrency } from '../lib/utils.js';

export default function ItemsEditor({ doc, updateItem, removeItem }) {
  return (
    <div className="items-editor">
      {doc.items.map((item, idx) => (
        <div key={item.id} className="item-row">
          <div className="item-row-header">
            <span className="item-number">{idx+1}</span>
            <button className="btn btn-ghost btn-sm item-delete" onClick={() => removeItem(item.id)}>×</button>
          </div>
          <div className="form-group">
            <input className="input" placeholder="品目・作業内容を入力" value={item.name} onChange={e => updateItem(item.id,{name:e.target.value})} />
          </div>
          <div className="item-qty-row">
            <div className="form-group">
              <label className="form-label">数量</label>
              <NumInput value={item.quantity} onChange={v => updateItem(item.id,{quantity:v})} placeholder="0" isFloat={true} />
            </div>
            <div className="form-group">
              <label className="form-label">単位</label>
              <input className="input" placeholder="式" value={item.unit} onChange={e => updateItem(item.id,{unit:e.target.value})} style={{minWidth:0}} />
            </div>
            <div className="form-group">
              <label className="form-label">単価（円）</label>
              <NumInput value={item.unitPrice} onChange={v => updateItem(item.id,{unitPrice:v})} placeholder="0" />
            </div>
          </div>
          <div className="item-tax-row">
            <div className="tax-selects">
              <select className="input tax-select" value={item.taxType} onChange={e => updateItem(item.id,{taxType:e.target.value})}>
                <option value="exclusive">税別</option><option value="inclusive">税込</option>
              </select>
              <select className="input tax-rate-select" value={item.taxRate} onChange={e => updateItem(item.id,{taxRate:parseInt(e.target.value)})}>
                {[10,8,0].map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div className="item-subtotal">{formatCurrency(item.quantity * item.unitPrice)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
