import { toHankaku, formatPhone } from '../../lib/utils.js';

export default function PhoneInput({ value, onChange, placeholder='03-0000-0000' }) {
  const handleChange = e => {
    const raw = toHankaku(e.target.value);
    const cleaned = raw.replace(/[^\d\-]/g,'');
    onChange(cleaned);
  };
  const handleBlur = e => {
    onChange(formatPhone(e.target.value));
  };
  return (
    <input className="input" placeholder={placeholder} value={value} onChange={handleChange} onBlur={handleBlur} maxLength={15} />
  );
}
