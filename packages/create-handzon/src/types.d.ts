declare module "@clack/prompts" {
  export function intro(msg?: string): void;
  export function outro(msg?: string): void;
  export function cancel(msg?: string): void;
  export function text(opts: {
    message: string;
    placeholder?: string;
    defaultValue?: string;
    validate?: (v: string) => string | undefined;
  }): Promise<string | symbol>;
  export function confirm(opts: {
    message: string;
    initialValue?: boolean;
  }): Promise<boolean | symbol>;
  export function select(opts: {
    message: string;
    options: Array<{ value: string; label?: string }>;
  }): Promise<string | symbol>;
  export function isCancel(value: unknown): value is symbol;
  export const log: {
    error: (msg: string) => void;
    warn: (msg: string) => void;
    info: (msg: string) => void;
    success: (msg: string) => void;
  };
  export function spinner(): { start: (msg?: string) => void; stop: (msg?: string) => void };
}
