type StateChangeListener<TState> = (state: TState) => void;

export interface WithInterruption {
  interrupt(): void;
}

export abstract class BaseStateService<TState> {
  protected state: TState;
  private listeners: Set<StateChangeListener<TState>> = new Set();

  constructor(initialState: TState) {
    this.state = initialState;
  }

  getState(): TState {
    return { ...(this.state as unknown as object) } as TState;
  }

  onStateChange(callback: StateChangeListener<TState>): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  protected setState(update: Partial<TState> | ((prev: TState) => Partial<TState> | TState)): void {
    const next = typeof update === 'function' ? (update as (prev: TState) => Partial<TState> | TState)(this.state) : update;
    const nextState: TState = (next as unknown as object && !Array.isArray(next))
      ? { ...(this.state as unknown as object), ...(next as unknown as object) } as TState
      : (next as TState);
    this.state = nextState;
    this.notifyStateChange();
  }

  protected notifyStateChange(): void {
    const snapshot = this.getState();
    this.listeners.forEach(listener => listener(snapshot));
  }
}

type Constructor<T = {}> = new (...args: unknown[]) => T;

export function withInterruption<TBase extends Constructor>(Base: TBase) {
  return class WithInterruptionMixin extends (Base as Constructor) implements WithInterruption {
    interrupt(): void {
      // Default no-op. Subclasses can override to provide real interruption behavior.
    }
  } as unknown as TBase & Constructor<WithInterruption>;
}



