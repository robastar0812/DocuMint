import { useState } from 'react';
import { processImage } from '../lib/utils.js';

export default function StampUploader({ doc, setStampImage, label='角印', icon='🔏' }) {
  const [processing, setProcessing] = useState(false);
  const isStamp = label === '角印';
  const imgKey = isStamp ? 'stampImage' : 'logoImage';
  const imgSrc = doc[imgKey];

  const handleFile = file => {
    if (!file) return;
    const ok = file.type.startsWith('image/') ||
      /\.(png|jpe?g|gif|webp|bmp)$/i.test(file.name);
    if (!ok) return;
    setProcessing(true);
    processImage(file, isStamp, result => {
      setStampImage(result);
      setProcessing(false);
    });
  };

  const openFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.png,.jpg,.jpeg,.gif,.webp,.bmp';
    input.style.display = 'none';
    input.onchange = e => {
      handleFile(e.target.files[0]);
      document.body.removeChild(input);
    };
    input.addEventListener('cancel', () => {
      try { document.body.removeChild(input); } catch(e) {}
    });
    document.body.appendChild(input);
    input.click();
  };

  return (
    <div className="stamp-uploader">
      {imgSrc ? (
        <div className="stamp-preview-area">
          <img src={imgSrc} alt={label} className="stamp-preview-img" style={{background:'#f0f0f0'}} />
          <div className="stamp-preview-info" style={{minWidth:0}}>
            <p className="stamp-hint">プレビュー上でドラッグ（PC）またはタップ長押し（スマホ）で位置調整できます</p>
            <button className="btn btn-ghost btn-sm" onClick={() => setStampImage(null)}>削除</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="stamp-drop-zone"
            onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); }}
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
            onDragLeave={e => e.currentTarget.classList.remove('dragover')}
            onClick={openFilePicker}>
            {processing ? (
              <div style={{padding:'16px 0'}}>
                <div className="stamp-drop-icon">⏳</div>
                <p className="stamp-drop-text">処理中...</p>
              </div>
            ) : (
              <>
                <div className="stamp-drop-icon">{icon}</div>
                <p className="stamp-drop-text">{label}画像をドロップ</p>
                <p className="stamp-drop-sub">PNG / JPG 対応 · 黒背景は自動で透過処理</p>
              </>
            )}
          </div>
          <button className="btn btn-outline btn-sm"
            style={{width:'100%',marginTop:8,justifyContent:'center',overflow:'hidden',textOverflow:'ellipsis',minWidth:0}}
            onClick={openFilePicker}>
            📁 ファイルを選択（スマホはこちら）
          </button>
        </div>
      )}
    </div>
  );
}
