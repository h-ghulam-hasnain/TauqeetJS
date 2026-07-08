let vsop87Loaded = false;
let vsop87LoadPromise: Promise<void> | null = null;

/**
 * Lazy loads the heavy VSOP87 coefficient tables.
 * Safe to call multiple times; will only load once.
 */
export async function getVSOP87Tables(): Promise<void> {
  if (vsop87Loaded) {
    return;
  }
  
  if (vsop87LoadPromise) {
    return vsop87LoadPromise;
  }

  vsop87LoadPromise = (async () => {
    // Dynamic import to keep main thread light at startup
    await import('./theories/vsop87/vsop87Coefficients.js');
    vsop87Loaded = true;
  })();

  return vsop87LoadPromise;
}
