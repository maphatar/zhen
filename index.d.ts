export interface HerdOptions {
  dsn?: string;
  release?: string;
  once?: boolean;
  debug?: boolean;
  environment?: string; 
}

export function herd(options?: HerdOptions): void;
