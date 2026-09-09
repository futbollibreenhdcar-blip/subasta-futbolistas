import { removeBackground } from '@imgly/background-removal';

export type ProgressCallback = (message: string, ratio: number) => void;

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function processImageBackgroundRemoval(
  fileOrBlob: Blob | File,
  onProgress?: ProgressCallback
): Promise<string> {
  // Callback para reportar etapas (descarga de modelo ONNX y procesamiento)
  const resultBlob = await removeBackground(fileOrBlob, {
    progress: (key: string, current: number, total: number) => {
      let label = 'Procesando recorte con IA...';
      if (key.includes('fetch:') || key.includes('download')) {
        label = 'Descargando modelo neuronal...';
      } else if (key.includes('compute:') || key.includes('inference')) {
        label = 'Segmentando silueta de futbolista...';
      }
      const ratio = total > 0 ? Math.min(1, Math.max(0, current / total)) : 0;
      if (onProgress) {
        onProgress(label, ratio);
      }
    },
  });

  return await blobToDataUrl(resultBlob);
}
