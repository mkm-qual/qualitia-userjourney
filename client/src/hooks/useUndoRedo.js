import { useReducer, useCallback } from 'react';

const MAX_HISTORY = 20;

const UNDO = 'UNDO';
const REDO = 'REDO';
const SET = 'SET';

function reducer(state, action) {
  switch (action.type) {
    case SET: {
      const newPast = [...state.past, state.present].slice(-MAX_HISTORY);
      return { past: newPast, present: action.payload, future: [] };
    }
    case UNDO: {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return { past: newPast, present: previous, future: [state.present, ...state.future] };
    }
    case REDO: {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return { past: [...state.past, state.present], present: next, future: newFuture };
    }
    default:
      return state;
  }
}

export function useUndoRedo(initialState) {
  const [state, dispatch] = useReducer(reducer, {
    past: [],
    present: initialState,
    future: []
  });

  const set = useCallback((newPresent) => {
    dispatch({ type: SET, payload: newPresent });
  }, []);

  const undo = useCallback(() => dispatch({ type: UNDO }), []);
  const redo = useCallback(() => dispatch({ type: REDO }), []);

  const reset = useCallback((newState) => {
    dispatch({ type: SET, payload: newState });
    // After reset we don't want history from before; clear manually
  }, []);

  return {
    state: state.present,
    set,
    undo,
    redo,
    reset: (s) => dispatch({ type: 'RESET', payload: s }),
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    historyLength: state.past.length
  };
}

// Special reset action
const originalReducer = reducer;
function reducerWithReset(state, action) {
  if (action.type === 'RESET') {
    return { past: [], present: action.payload, future: [] };
  }
  return originalReducer(state, action);
}

export function useUndoRedoFull(initialState) {
  const [state, dispatch] = useReducer(reducerWithReset, {
    past: [],
    present: initialState,
    future: []
  });

  const set = useCallback((newPresent) => {
    dispatch({ type: SET, payload: newPresent });
  }, []);

  const undo = useCallback(() => dispatch({ type: UNDO }), []);
  const redo = useCallback(() => dispatch({ type: REDO }), []);
  const reset = useCallback((s) => dispatch({ type: 'RESET', payload: s }), []);

  return {
    state: state.present,
    set,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    historyLength: state.past.length
  };
}
