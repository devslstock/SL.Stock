export async function downloadOrShareFile(blob: Blob, filename: string) {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile && navigator.share) {
    try {
      const file = new File([blob], filename, { type: blob.type });
      await navigator.share({
        files: [file],
        title: filename
      });
      return;
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('Share failed', e);
        fallbackDownload(blob, filename);
      }
    }
  } else if (isMobile) {
    fallbackDownload(blob, filename);
  } else {
    // Desktop: Try to open in new tab for PDF, or just download
    const url = URL.createObjectURL(blob);
    if (blob.type === 'application/pdf') {
      window.open(url, '_blank');
    } else {
      fallbackDownload(blob, filename);
    }
  }
}

function fallbackDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
