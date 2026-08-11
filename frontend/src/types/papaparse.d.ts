declare module "papaparse" {
  export interface ParseOptions<T> {
    header?: boolean;
    skipEmptyLines?: boolean;
    delimiter?: string;
    complete?: (results: ParseResult<T>) => void;
    error?: (error: Error) => void;
  }

  export interface ParseResult<T> {
    data: T[];
    errors: Error[];
    meta: {
      cursor: number;
      delimiter: string;
      linebreak: string;
      aborted: boolean;
      truncated: boolean;
      fields: string[];
    };
  }

  export function parse<T>(input: string, options?: ParseOptions<T>): ParseResult<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function unparse(data: unknown[], options?: unknown): string;
}