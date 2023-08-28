declare module 'langium-cli' {
  export interface GenerateOptions {
    file?: string;
    mode?: 'development' | 'production';
    watch?: boolean;
  }

  export function generate(options: GenerateOptions): Promise<boolean>;
}
