import { useState, useCallback, useRef } from 'react';

export function useUndoRedo<T>(initialState: T, maxHistory = 20) {
  const [state, setState] = useState<T>(initialState);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);

  const commit = useCallback((newState: T) => {
    // Se o novo estado for igual ao atual (por referência), não faz nada
    if (newState === state) return;

    pastRef.current = [...pastRef.current, state];
    if (pastRef.current.length > maxHistory) {
      pastRef.current.shift();
    }
    futureRef.current = [];
    setState(newState);
  }, [state, maxHistory]);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;

    const previous = pastRef.current[pastRef.current.length - 1];
    const newPast = pastRef.current.slice(0, pastRef.current.length - 1);

    futureRef.current = [state, ...futureRef.current];
    pastRef.current = newPast;
    setState(previous);
    return previous;
  }, [state]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;

    const next = futureRef.current[0];
    const newFuture = futureRef.current.slice(1);

    pastRef.current = [...pastRef.current, state];
    futureRef.current = newFuture;
    setState(next);
    return next;
  }, [state]);

  const reset = useCallback((newState: T) => {
    setState(newState);
    pastRef.current = [];
    futureRef.current = [];
  }, []);

  return {
    state,
    setState, // Usar apenas para atualizações silenciosas que não devem entrar no histórico
    commit,   // Usar para salvar um novo estado no histórico
    undo,
    redo,
    reset,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
