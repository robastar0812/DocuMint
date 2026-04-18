import { useState, useEffect } from 'react';

export const STORAGE_KEY = 'invoice-app-storage';

export const createEmptyItem = () => ({
  id: Date.now() + Math.random(),
  name: '', quantity: 1, unit: '式', unitPrice: 0,
  taxType: 'exclusive', taxRate: 10,
});

export const defaultMyCompany = { name:'',postalCode:'',address:'',phone:'',fax:'',email:'',bankName:'',bankBranch:'',bankType:'普通',bankNumber:'',bankHolder:'',registrationNumber:'' };
export const defaultClient = { name:'',postalCode:'',address:'',honorific:'御中' };
export const defaultDocument = {
  type:'invoice', number:'', issueDate: (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
  dueDate: (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(), subject:'', notes:'', items:[createEmptyItem()],
  stampPosition:{x:60,y:60}, stampImage:null, logoImage:null, logoPosition:{x:10,y:90},
};
export const defaultDocSettings = { tableHeader:'#ffffff', amountBox:'#ffffff', totalBar:'#ffffff', docFont:"'Noto Serif JP', serif" };

function loadStorage() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

export function useAppState() {
  const saved = loadStorage();
  const [myCompany, setMyCompanyState] = useState(saved.myCompany || defaultMyCompany);
  const [client, setClientState] = useState(saved.client || defaultClient);
  const [doc, setDocState] = useState(saved.document || defaultDocument);
  const [docSettings, setDocSettingsState] = useState(saved.docSettings || defaultDocSettings);
  const [templates, setTemplates] = useState(saved.templates || []);
  const [savedDocs, setSavedDocs] = useState(saved.savedDocs || []);
  const [isPro, setIsPro] = useState(saved.isPro || false);
  const [activeModal, setActiveModal] = useState(null);
  const [mobileTab, setMobileTab] = useState('input');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ myCompany, client, document: doc, docSettings, templates, savedDocs, isPro }));
    } catch (e) {
      console.warn('localStorage保存エラー:', e.message);
      if (e.name === 'QuotaExceededError' || e.code === 22) alert('⚠️ 端末の保存容量が上限に達しました。\n不要な保存書類やテンプレートを削除してください。\nログインするとクラウドに保存されます。');
    }
  }, [myCompany, client, doc, docSettings, templates, savedDocs, isPro]);

  const setMyCompany = d => setMyCompanyState(p => ({...p,...d}));
  const setClient = d => setClientState(p => ({...p,...d}));
  const setDocument = d => setDocState(p => ({...p,...d}));
  const setDocumentType = type => setDocState(p => ({...p, type}));
  const setDocSettings = s => setDocSettingsState(s);
  const addItem = () => setDocState(p => ({...p, items:[...p.items, createEmptyItem()]}));
  const removeItem = id => setDocState(p => ({...p, items: p.items.filter(i => i.id !== id)}));
  const updateItem = (id, data) => setDocState(p => ({...p, items: p.items.map(i => i.id === id ? {...i,...data} : i)}));
  const setStampImage = img => setDocState(p => ({...p, stampImage: img}));
  const setStampPosition = pos => setDocState(p => ({...p, stampPosition: pos}));
  const setLogoImage = img => setDocState(p => ({...p, logoImage: img}));
  const setLogoPosition = pos => setDocState(p => ({...p, logoPosition: pos}));
  const getLocalDate = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const resetDocument = () => setDocState({...defaultDocument, issueDate: getLocalDate(), dueDate: getLocalDate(), items:[createEmptyItem()], stampImage: doc.stampImage, logoImage: doc.logoImage});
  const saveTemplate = name => setTemplates(p => [...p, {id:Date.now(), name, createdAt:new Date().toISOString(), subject:doc.subject, notes:doc.notes, items:doc.items}]);
  const loadTemplate = id => { const t = templates.find(t=>t.id===id); if(t) setDocState(p=>({...p,subject:t.subject,notes:t.notes,items:t.items})); };
  const deleteTemplate = id => setTemplates(p => p.filter(t=>t.id!==id));
  const saveDocument = name => setSavedDocs(p => {
    const {stampImage, logoImage, ...docWithoutImages} = doc;
    return [...p, {id:Date.now(), name, savedAt:new Date().toISOString(), type:doc.type, document:docWithoutImages, client:{...client}}];
  });
  const loadDocument = id => { const d = savedDocs.find(d=>d.id===id); if(d) { setDocState(p => ({...d.document, stampImage: p.stampImage, logoImage: p.logoImage})); setClientState(d.client); } };
  const deleteDoc = id => setSavedDocs(p => p.filter(d=>d.id!==id));
  const duplicateDocument = id => { const d = savedDocs.find(d=>d.id===id); if(d) setSavedDocs(p => [...p, {...d, id:Date.now(), name:d.name+'（コピー）', savedAt:new Date().toISOString()}]); };

  const loadAll = (data) => {
    if (data.myCompany) setMyCompanyState({...defaultMyCompany, ...data.myCompany});
    if (data.client) setClientState({...defaultClient, ...data.client});
    if (data.docSettings) {
      const { _stampImage, _logoImage, _stampPosition, _logoPosition, ...pureSettings } = data.docSettings;
      setDocSettingsState({...defaultDocSettings, ...pureSettings});
      if (_stampImage) setStampImage(_stampImage);
      if (_logoImage) setLogoImage(_logoImage);
      if (_stampPosition) setStampPosition(_stampPosition);
      if (_logoPosition) setLogoPosition(_logoPosition);
    }
    if (data.templates) setTemplates(data.templates);
    if (data.savedDocs) setSavedDocs(data.savedDocs);
    if (typeof data.isPro === 'boolean') setIsPro(data.isPro);
  };

  return { myCompany, setMyCompany, client, setClient, doc, setDocument, setDocumentType, docSettings, setDocSettings, templates, saveTemplate, loadTemplate, deleteTemplate, savedDocs, saveDocument, loadDocument, deleteDoc, duplicateDocument, addItem, removeItem, updateItem, setStampImage, setStampPosition, setLogoImage, setLogoPosition, resetDocument, isPro, setIsPro, activeModal, setActiveModal, mobileTab, setMobileTab, loadAll };
}
