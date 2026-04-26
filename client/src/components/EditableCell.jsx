import { useState, useRef, useEffect } from 'react';

export default function EditableCell({ value, onChange, color, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
      autoResize(textareaRef.current);
    }
  }, [editing]);

  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  function handleClick() {
    setDraft(value);
    setEditing(true);
  }

  function handleBlur() {
    setEditing(false);
    if (draft !== value) {
      onChange(draft);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setDraft(value);
      setEditing(false);
    }
  }

  const lines = (value || '').split('\n').filter(Boolean);

  return (
    <div
      className="min-h-[80px] relative group"
      style={{ borderLeft: `3px solid ${color}20` }}
    >
      {editing ? (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={e => { setDraft(e.target.value); autoResize(e.target); }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full p-3 text-sm text-gray-800 bg-white border-2 border-blue-400 rounded-lg resize-none leading-relaxed"
          style={{ minHeight: '80px' }}
          placeholder={placeholder || 'Click to edit…'}
        />
      ) : (
        <div
          onClick={handleClick}
          className="p-3 cursor-text min-h-[80px] hover:bg-white/60 rounded-lg transition-colors group-hover:bg-white/40"
        >
          {lines.length === 0 ? (
            <p className="text-gray-300 text-sm italic select-none">{placeholder || 'Click to add content…'}</p>
          ) : (
            <div className="space-y-1">
              {lines.map((line, i) => (
                <p key={i} className="text-sm text-gray-700 leading-relaxed">{line}</p>
              ))}
            </div>
          )}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
