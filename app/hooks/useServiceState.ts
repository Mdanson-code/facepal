import { useEffect, useState } from 'react';

export interface StateService<TState> {
  getState(): TState;
  onStateChange(callback: (state: TState) => void): () => void;
}

export function useServiceState<TState>(service: StateService<TState>): TState {
  const [state, setState] = useState<TState>(service.getState());

  useEffect(() => {
    const unsubscribe = service.onStateChange(setState);
    return unsubscribe;
  }, [service]);

  return state;
}



