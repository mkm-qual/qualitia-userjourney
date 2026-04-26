import { useState } from 'react';
import EditableCell from './EditableCell';

const ROW_COLORS = {
  userSteps: '#3B82F6',
  userActions: '#8B5CF6',
  feelingsThoughts: '#EC4899',
  painPoints: '#EF4444',
  aiOpportunities: '#10B981'
};

export default function JourneyMap({ journeyData, onChange }) {
  const [editingPhaseName, setEditingPhaseName] = useState(null);
  const [phaseNameDraft, setPhaseNameDraft] = useState('');

  const { phases = [], rowHeaders = [] } = journeyData;
  const sortedPhases = [...phases].sort((a, b) => a.order - b.order);

  function updateCell(phaseId, rowId, value) {
    const updatedPhases = phases.map(p =>
      p.id === phaseId ? { ...p, cells: { ...p.cells, [rowId]: value } } : p
    );
    onChange({ ...journeyData, phases: updatedPhases });
  }

  function addPhase() {
    const newPhase = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      name: 'New Phase',
      order: phases.length,
      cells: Object.fromEntries(rowHeaders.map(r => [r.id, '']))
    };
    onChange({ ...journeyData, phases: [...phases, newPhase] });
  }

  function deletePhase(phaseId) {
    if (!confirm('Delete this phase?')) return;
    const remaining = phases.filter(p => p.id !== phaseId).map((p, i) => ({ ...p, order: i }));
    onChange({ ...journeyData, phases: remaining });
  }

  function movePhase(phaseId, direction) {
    const sorted = [...phases].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(p => p.id === phaseId);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= sorted.length) return;
    const updated = sorted.map((p, i) => {
      if (i === idx) return { ...p, order: newIdx };
      if (i === newIdx) return { ...p, order: idx };
      return p;
    });
    onChange({ ...journeyData, phases: updated });
  }

  function savePhaseName(phaseId) {
    const updatedPhases = phases.map(p =>
      p.id === phaseId ? { ...p, name: phaseNameDraft } : p
    );
    onChange({ ...journeyData, phases: updatedPhases });
    setEditingPhaseName(null);
  }

  function updateRowHeader(rowId, field, value) {
    const updatedHeaders = rowHeaders.map(h => h.id === rowId ? { ...h, [field]: value } : h);
    onChange({ ...journeyData, rowHeaders: updatedHeaders });
  }

  const PHASE_WIDTH = 280;
  const ROW_HEADER_WIDTH = 180;

  return (
    <div className="flex-1 overflow-auto scrollbar-thin bg-gray-50">
      <div style={{ minWidth: ROW_HEADER_WIDTH + sortedPhases.length * PHASE_WIDTH + 80 }}>
        {/* Header row */}
        <div className="flex sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div
            className="flex-shrink-0 sticky left-0 z-30 bg-white border-r border-gray-200 flex items-center px-4"
            style={{ width: ROW_HEADER_WIDTH, minWidth: ROW_HEADER_WIDTH }}
          >
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Journey Phases
            </div>
          </div>

          {sortedPhases.map((phase, idx) => (
            <div
              key={phase.id}
              className="flex-shrink-0 border-r border-gray-200 bg-gradient-to-b from-blue-600 to-blue-700"
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
                  <button
                    onClick={() => movePhase(phase.id, -1)}
                    disabled={idx === 0}
                    className="p-1 text-white/60 hover:text-white disabled:opacity-20 transition-colors"
                    title="Move left"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => movePhase(phase.id, 1)}
                    disabled={idx === sortedPhases.length - 1}
                    className="p-1 text-white/60 hover:text-white disabled:opacity-20 transition-colors"
                    title="Move right"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deletePhase(phase.id)}
                    className="p-1 text-white/60 hover:text-red-300 transition-colors"
                    title="Delete phase"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add phase button in header */}
          <div className="flex-shrink-0 flex items-center px-3" style={{ width: 80, minWidth: 80 }}>
            <button
              onClick={addPhase}
              className="flex items-center gap-1 px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium rounded-lg transition border border-blue-200"
              title="Add new phase"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          </div>
        </div>

        {/* Row data */}
        {rowHeaders.map((row, rowIdx) => (
          <div
            key={row.id}
            className="flex border-b border-gray-200"
            style={{ background: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}
          >
            {/* Row header */}
            <div
              className="flex-shrink-0 sticky left-0 z-10 border-r border-gray-200 p-3 flex flex-col justify-start"
              style={{
                width: ROW_HEADER_WIDTH,
                minWidth: ROW_HEADER_WIDTH,
                background: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
                borderLeft: `4px solid ${row.color}`
              }}
            >
              <div
                className="text-sm font-bold mb-0.5"
                style={{ color: row.color }}
              >
                {row.label}
              </div>
              <div className="text-xs text-gray-400 leading-tight">{row.description}</div>
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
      </div>
    </div>
  );
}
