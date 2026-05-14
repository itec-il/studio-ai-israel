import { AppLayout } from '@/components/layout/AppLayout';
import { useEffect, useState } from 'react';
import { Palette, Save, Plus, Trash2, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { VoiceDictationButton } from '@/components/VoiceDictationButton';
import { brandService, type Brand } from '@/services/creativeService';

const PRESET_COLORS = ['#0d2547', '#1d8a5c', '#d4af37', '#dc2626', '#3b82f6', '#7c3aed', '#0d9488', '#ec4899'];

function makeBrand(name = ''): Brand {
  return {
    id: `brand-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    logo: '',
    colors: [],
    tone: '',
    targetAudience: '',
    industry: '',
    departments: [],
  };
}

export default function BrandSettingsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [draft, setDraft] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newDept, setNewDept] = useState('');

  const active = brands.find(b => b.id === activeId) || null;

  useEffect(() => {
    (async () => {
      try {
        const list = await brandService.getAllAsync();
        setBrands(list);
        const stored = localStorage.getItem('active_brand_id');
        const first = list.find(b => b.id === stored) || list[0];
        if (first) {
          setActiveId(first.id);
          setDraft({ ...first });
        }
      } catch (e) {
        toast.error('שגיאה בטעינת המותגים');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (active) setDraft({ ...active });
  }, [activeId]);

  const dirty = !!draft && !!active && JSON.stringify(draft) !== JSON.stringify(active);

  const update = <K extends keyof Brand>(key: K, value: Brand[K]) => {
    setDraft(d => (d ? { ...d, [key]: value } : d));
  };

  const handleSave = async () => {
    if (!draft) return;
    if (!draft.name.trim()) { toast.error('שם המותג חובה'); return; }
    setSaving(true);
    try {
      const updated = await brandService.update(draft.id, draft);
      setBrands(updated);
      localStorage.setItem('active_brand_id', draft.id);
      toast.success('המותג נשמר');
    } catch {
      toast.error('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    const name = prompt('שם המותג החדש:');
    if (!name?.trim()) return;
    const fresh = makeBrand(name.trim());
    setSaving(true);
    try {
      const updated = await brandService.add(fresh);
      setBrands(updated);
      setActiveId(fresh.id);
      setDraft({ ...fresh });
      localStorage.setItem('active_brand_id', fresh.id);
      toast.success(`המותג "${fresh.name}" נוצר`);
    } catch {
      toast.error('שגיאה ביצירה');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!active) return;
    if (!confirm(`למחוק את המותג "${active.name}"?`)) return;
    try {
      const updated = await brandService.remove(active.id);
      setBrands(updated);
      const next = updated[0];
      if (next) {
        setActiveId(next.id);
        setDraft({ ...next });
        localStorage.setItem('active_brand_id', next.id);
      } else {
        setActiveId('');
        setDraft(null);
        localStorage.removeItem('active_brand_id');
      }
      toast.success('המותג נמחק');
    } catch {
      toast.error('שגיאה במחיקה');
    }
  };

  const toggleColor = (c: string) => {
    if (!draft) return;
    const has = draft.colors.includes(c);
    update('colors', has ? draft.colors.filter(x => x !== c) : [...draft.colors, c]);
  };

  const addCustomColor = () => {
    const c = prompt('צבע hex (לדוגמה: #ff5733):');
    if (!c?.match(/^#[0-9a-f]{6}$/i)) { if (c) toast.error('פורמט לא תקין'); return; }
    if (!draft || draft.colors.includes(c)) return;
    update('colors', [...draft.colors, c]);
  };

  const addDept = () => {
    if (!newDept.trim() || !draft) return;
    if (draft.departments?.includes(newDept.trim())) return;
    update('departments', [...(draft.departments || []), newDept.trim()]);
    setNewDept('');
  };
  const removeDept = (d: string) => {
    if (!draft) return;
    update('departments', (draft.departments || []).filter(x => x !== d));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-rubik font-bold flex items-center gap-2">
              <Palette className="w-6 h-6 text-primary" /> חברות ומותגים
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              כל חברה היא תיק עסקי שלם — נטען אוטומטית בכל יצירת תוכן
            </p>
          </div>
          <button onClick={handleAdd} disabled={saving}
            className="gradient-gold text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            <Plus className="w-4 h-4" /> חברה חדשה
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar list */}
          <div className="bg-card border border-border rounded-xl p-3 space-y-1 h-fit">
            {brands.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm px-4">
                <Building2 className="w-10 h-10 mx-auto opacity-40 mb-3" />
                אין חברות עדיין. לחץ &quot;חברה חדשה&quot; כדי להתחיל.
              </div>
            ) : (
              brands.map(b => (
                <button
                  key={b.id}
                  onClick={() => setActiveId(b.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-right text-sm transition-colors ${
                    activeId === b.id ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/50'
                  }`}
                >
                  <Building2 className="w-4 h-4 flex-shrink-0 opacity-60" />
                  <span className="truncate">{b.name || 'ללא שם'}</span>
                </button>
              ))
            )}
          </div>

          {/* Editor */}
          {draft ? (
            <div className="space-y-5">
              {/* Save bar */}
              <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">עורך:</span>{' '}
                  <span className="font-semibold">{draft.name || 'מותג חדש'}</span>
                  {dirty && <span className="text-xs text-amber-500 mr-2">• יש שינויים שלא נשמרו</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleDelete} className="p-2 rounded-lg text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={handleSave} disabled={!dirty || saving}
                    className="gradient-gold text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    שמור
                  </button>
                </div>
              </div>

              {/* Identity */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="font-rubik font-semibold">זהות החברה</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="שם החברה *" value={draft.name} onChange={v => update('name', v)} />
                  <Field label="תחום / ענף" value={draft.industry} onChange={v => update('industry', v)}
                    placeholder="למשל: ייעוץ עסקי, רפואה, נדל&quot;ן" />
                  <Field label="טון תקשורת" value={draft.tone} onChange={v => update('tone', v)}
                    placeholder="למשל: מקצועי, ידידותי, יוקרתי" />
                  <Field label="קהל יעד" value={draft.targetAudience} onChange={v => update('targetAudience', v)}
                    placeholder="למשל: בעלי עסקים בני 35-60" />
                </div>
              </div>

              {/* Logo */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-3">
                <h2 className="font-rubik font-semibold">לוגו</h2>
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {draft.logo ? (
                      <img src={draft.logo} alt="logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-8 h-8 text-muted-foreground opacity-40" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input value={draft.logo || ''} onChange={e => update('logo', e.target.value)}
                      placeholder="https://... (URL ללוגו)"
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    <p className="text-xs text-muted-foreground mt-1">
                      הלוגו ייטען אוטומטית כתמונת רפרנס בכל יצירה
                    </p>
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-3">
                <h2 className="font-rubik font-semibold">צבעי המותג ({draft.colors.length})</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {draft.colors.map(c => (
                    <button key={c} onClick={() => toggleColor(c)} title="הסר"
                      className="w-10 h-10 rounded-lg border-2 border-primary relative group">
                      <span className="absolute inset-0 rounded-lg" style={{ backgroundColor: c }} />
                      <span className="absolute -top-1 -left-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[10px] opacity-0 group-hover:opacity-100 flex items-center justify-center">×</span>
                    </button>
                  ))}
                  {PRESET_COLORS.filter(c => !draft.colors.includes(c)).map(c => (
                    <button key={c} onClick={() => toggleColor(c)}
                      className="w-10 h-10 rounded-lg border border-border opacity-60 hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: c }} title="הוסף" />
                  ))}
                  <button onClick={addCustomColor}
                    className="w-10 h-10 rounded-lg border border-dashed border-border flex items-center justify-center hover:bg-muted/50">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  לחץ על צבע כדי להוסיף, או על צבע מסומן כדי להסיר
                </p>
              </div>

              {/* Departments / sub-activities */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-3">
                <h2 className="font-rubik font-semibold">תתי-פעילויות ({(draft.departments || []).length})</h2>
                <p className="text-xs text-muted-foreground">
                  קטגוריות תוכן בתוך החברה (למשל: מכירת חברות, הערכת שווי, ייעוץ)
                </p>
                <div className="flex flex-wrap gap-2">
                  {(draft.departments || []).map(d => (
                    <span key={d} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      {d}
                      <button onClick={() => removeDept(d)} className="hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newDept} onChange={e => setNewDept(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addDept()}
                    placeholder="תת-פעילות חדשה"
                    className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  <button onClick={addDept} disabled={!newDept.trim()}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
                    הוסף
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto opacity-30 mb-3" />
              <p>בחר חברה מהרשימה משמאל, או צור חברה חדשה</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium">{label}</label>
        <VoiceDictationButton onResult={t => onChange((value || '') + (value ? ' ' : '') + t)} />
      </div>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
    </div>
  );
}
