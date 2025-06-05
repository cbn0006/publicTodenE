// global.d.ts or a similar type definition file
interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
  // other properties/methods if needed
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: Blob | BufferSource | string): Promise<void>;
  close(): Promise<void>;
  seek?(position: number): Promise<void>;
  truncate?(size: number): Promise<void>;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string | string[]>;
  }>;
  excludeAcceptAllOption?: boolean;
}

declare global {
  interface Window {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
  }
  interface Navigator {
    msSaveBlob?: (blob: Blob, defaultName?: string) => boolean;
  }
}