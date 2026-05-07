import { useState, useRef, useEffect } from 'react';
import EditableCell from './EditableCell';

const PALETTE = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#10B981',
  '#F59E0B', '#06B6D4', '#F97316', '#6366F1', '#84CC16',
  '#14B8A6', '#A855F7', '#DC2626', '#0EA5E9', '#16A34A',
];

function genId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

/* ── Inline text editor for row header fields ── */
function InlineEdit({ value, onSave, className, placeholder, multiline }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  function commit() {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim() || value);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !multiline) { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setDraft(value); setEditing(false); }
  }

  if (editing) {
    const props = {
      ref,
      value: draft,
      onChange: e => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: handleKey,
      className: `w-full bg-white/80 border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 ${className}`,
      placeholder,
    };
    return multiline
      ? <textarea {...props} rows={2} style={{ resize: 'none' }} />
      : <input {...props} type="text" />;
  }

  return (
    <span
      className={`cursor-text hover:bg-black/5 rounded px-0.5 py-px transition-colors group-hover:underline group-hover:decoration-dotted ${className}`}
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {value || <span className="italic opacity-40">{placeholder}</span>}
    </span>
  );
}

/* ── Colour swatch picker ── */
function ColorPicker({ current, onPick, onClose }) {
  return (
    <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-48">
      <p className="text-xs text-gray-500 mb-2 font-medium">Row colour</p>
      <div className="grid grid-cols-5 gap-1.5">
        {PALETTE.map(c => (
          <button
            key={c}
            onClick={() => onPick(c)}
            className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none"
            style={{
              background: c,
              borderColor: c === current ? '#fff' : c,
              boxShadow: c === current ? `0 0 0 2px ${c}` : 'none',
            }}
          />
        ))}
      </div>
      <button onClick={onClose} className="mt-2 text-xs text-gray-400 hover:text-gray-600 w-full text-center">Cancel</button>
    </div>
  );
}

/* ══ Main JourneyMap ══ */
export default function JourneyMap({ journeyData, onChange }) {
  const [editingPhaseName, setEditingPhaseName] = useState(null);
  const [phaseNameDraft, setPhaseNameDraft] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(null); // rowId

  const { phases = [], rowHeaders = [] } = journeyData;
  const sortedPhases = [...phases].sort((a, b) => a.order - b.order);

  /* ── cell ── */
  function updateCell(phaseId, rowId, value) {
    onChange({
      ...journeyData,
      phases: phases.map(p => p.id === phaseId ? { ...p, cells: { ...p.cells, [rowId]: value } } : p),
    });
  }

  /* ── phase ── */
  function addPhase() {
    const newPhase = {
      id: genId(), name: 'New Phase', order: phases.length,
      cells: Object.fromEntries(rowHeaders.map(r => [r.id, ''])),
    };
    onChange({ ...journeyData, phases: [...phases, newPhase] });
  }

  function deletePhase(phaseId) {
    if (!confirm('Delete this phase?')) return;
    onChange({ ...journeyData, phases: phases.filter(p => p.id !== phaseId).map((p, i) => ({ ...p, order: i })) });
  }

  function movePhase(phaseId, dir) {
    const sorted = [...phases].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(p => p.id === phaseId);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sorted.length) return;
    onChange({
      ...journeyData,
      phases: sorted.map((p, i) => {
        if (i === idx) return { ...p, order: newIdx };
        if (i === newIdx) return { ...p, order: idx };
        return p;
      }),
    });
  }

  function savePhaseName(phaseId) {
    onChange({ ...journeyData, phases: phases.map(p => p.id === phaseId ? { ...p, name: phaseNameDraft } : p) });
    setEditingPhaseName(null);
  }

  /* ── row header ── */
  function updateRowField(rowId, field, value) {
    onChange({ ...journeyData, rowHeaders: rowHeaders.map(h => h.id === rowId ? { ...h, [field]: value } : h) });
  }

  function updateRowColor(rowId, color) {
    onChange({ ...journeyData, rowHeaders: rowHeaders.map(h => h.id === rowId ? { ...h, color } : h) });
    setShowColorPicker(null);
  }

  function addRow() {
    const newRow = {
      id: genId(),
      label: 'New Row',
      description: 'Click to add a description',
      color: PALETTE[rowHeaders.length % PALETTE.length],
    };
    onChange({
      ...journeyData,
      rowHeaders: [...rowHeaders, newRow],
      phases: phases.map(p => ({ ...p, cells: { ...p.cells, [newRow.id]: '' } })),
    });
  }

  function deleteRow(rowId) {
    if (!confirm('Delete this row for all phases?')) return;
    const updatedPhases = phases.map(p => {
      const cells = { ...p.cells };
      delete cells[rowId];
      return { ...p, cells };
    });
    onChange({ ...journeyData, rowHeaders: rowHeaders.filter(h => h.id !== rowId), phases: updatedPhases });
  }

  function moveRow(rowId, dir) {
    const idx = rowHeaders.findIndex(h => h.id === rowId);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= rowHeaders.length) return;
    const updated = [...rowHeaders];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    onChange({ ...journeyData, rowHeaders: updated });
  }

  const PHASE_WIDTH = 280;
  const ROW_HEADER_WIDTH = 200;

  return (
    <div className="flex-1 overflow-auto scrollbar-thin bg-gray-50">
      <div style={{ minWidth: ROW_HEADER_WIDTH + sortedPhases.length * PHASE_WIDTH + 80 }}>

        {/* ── Phase header row ── */}
        <div className="flex sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div
            className="flex-shrink-0 sticky left-0 z-30 bg-white border-r border-gray-200 flex items-center px-4"
            style={{ width: ROW_HEADER_WIDTH, minWidth: ROW_HEADER_WIDTH }}
          >
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Journey Phases</span>
          </div>

          {sortedPhases.map((phase, idx) => (
            <div
              key={phase.id}
              className="flex-shrink-0 border-r border-blue-700 bg-gradient-to-b from-blue-600 to-blue-700"
              style={{ width: PHASE_WIDTH, minWidth: PHASE_WIDTH }}
            >
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-5 h-5 bg-white/20 text-white text-xs font-bold rounded flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  {editingPhaseName === phase.id ? (
                    <input
                      type="text"
                      value={phaseNameDraft}
                      onChange={e => setPhaseNameDraft(e.target.value)}
                      onBlur={() => savePhaseName(phase.id)}
                      onKeyDown={e => e.key === 'Enter' && savePhaseName(phase.id)}
                      className="flex-1 text-sm font-semibold text-white bg-blue-800 rounded px-2 py-0.5 min-w-0 focus:outline-none focus:ring-1 focus:ring-white/50"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="text-sm font-semibold text-white cursor-pointer truncate hover:text-blue-200 transition-colors"
                      onClick={() => { setEditingPhaseName(phase.id); setPhaseNameDraft(phase.name); }}
                      title="Click to rename"
                    >
                      {phase.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                  <button onClick={() => movePhase(phase.id, -1)} disabled={idx === 0}
                    className="p-1 text-white/60 hover:text-white disabled:opacity-20 transition-colors" title="Move left">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => movePhase(phase.id, 1)} disabled={idx === sortedPhases.length - 1}
                    className="p-1 text-white/60 hover:text-white disabled:opacity-20 transition-colors" title="Move right">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <button onClick={() => deletePhase(phase.id)}
                    className="p-1 text-white/60 hover:text-red-300 transition-colors" title="Delete phase">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="flex-shrink-0 flex items-center px-3" style={{ width: 80, minWidth: 80 }}>
            <button onClick={addPhase}
              className="flex items-center gap-1 px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium rounded-lg transition border border-blue-200"
              title="Add new phase">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add
            </button>
          </div>
        </div>

        {/* ── Data rows ── */}
        {rowHeaders.map((row, rowIdx) => (
          <div
            key={row.id}
            className="flex border-b border-gray-200 group/row"
            style={{ background: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}
          >
            {/* Row header — fully editable */}
            <div
              className="flex-shrink-0 sticky left-0 z-10 border-r border-gray-200 p-3 flex flex-col justify-between relative"
              style={{
                width: ROW_HEADER_WIDTH,
                minWidth: ROW_HEADER_WIDTH,
                background: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
                borderLeft: `4px solid ${row.color}`,
              }}
            >
              {/* Label */}
              <div className="group">
                <InlineEdit
                  value={row.label}
                  onSave={v => updateRowField(row.id, 'label', v)}
                  className="text-sm font-bold block w-full"
                  placeholder="Row name"
                  style={{ color: row.color }}
                />
              </div>

              {/* Description */}
              <div className="mt-0.5 group">
                <InlineEdit
                  value={row.description}
                  onSave={v => updateRowField(row.id, 'description', v)}
                  className="text-xs text-gray-400 block w-full leading-tight"
                  placeholder="Add description…"
                  multiline
                />
              </div>

              {/* Row controls — visible on row hover */}
              <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                {/* Colour dot */}
                <div className="relative">
                  <button
                    onClick={() => setShowColorPicker(showColorPicker === row.id ? null : row.id)}
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                    style={{ background: row.color }}
                    title="Change colour"
                  />
                  {showColorPicker === row.id && (
                    <ColorPicker
                      current={row.color}
                      onPick={c => updateRowColor(row.id, c)}
                      onClose={() => setShowColorPicker(null)}
                    />
                  )}
                </div>

                {/* Move up */}
                <button onClick={() => moveRow(row.id, -1)} disabled={rowIdx === 0}
                  className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors" title="Move up">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </button>

                {/* Move down */}
                <button onClick={() => moveRow(row.id, 1)} disabled={rowIdx === rowHeaders.length - 1}
                  className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors" title="Move down">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {/* Delete row */}
                <button onClick={() => deleteRow(row.id)}
                  className="p-0.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete row">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>

            {/* Phase cells */}
            {sortedPhases.map(phase => (
              <div
                key={phase.id}
                className="flex-shrink-0 border-r border-gray-100 p-1"
                style={{ width: PHASE_WIDTH, minWidth: PHASE_WIDTH }}
              >
                <EditableCell
                  value={phase.cells?.[row.id] || ''}
                  onChange={val => updateCell(phase.id, row.id, val)}
                  color={row.color}
                  placeholder={`${row.label} for ${phase.name}…`}
                />
              </div>
            ))}

            <div style={{ width: 80, minWidth: 80 }} />
          </div>
        ))}

        {/* ── Add Row button ── */}
        <div
          className="flex sticky left-0 border-b border-gray-200"
          style={{ background: '#f8fafc' }}
        >
          <div
            className="flex-shrink-0 sticky left-0 p-3"
            style={{ width: ROW_HEADER_WIDTH, minWidth: ROW_HEADER_WIDTH }}
          >
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-3 py-2 w-full text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-dashed border-gray-300 hover:border-blue-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Row
            </button>
          </div>
          {/* Spacer cells so the dashed border aligns nicely */}
          {sortedPhases.map(phase => (
            <div key={phase.id} className="flex-shrink-0" style={{ width: PHASE_WIDTH, minWidth: PHASE_WIDTH }} />
          ))}
          <div style={{ width: 80, minWidth: 80 }} />
        </div>

      </div>
    </div>
  );
}
