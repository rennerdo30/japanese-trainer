// Type declarations for tools
declare module 'cli-progress' {
  export interface SingleBarOptions {
    format?: string;
    barCompleteChar?: string;
    barIncompleteChar?: string;
    hideCursor?: boolean;
  }

  export class SingleBar {
    constructor(options?: SingleBarOptions);
    start(total: number, startValue: number, payload?: Record<string, unknown>): void;
    update(value: number, payload?: Record<string, unknown>): void;
    stop(): void;
  }
}
