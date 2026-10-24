// Network trap for test.mjs. Imported first in the harness process and preloaded
// into every child with `node --import`, so any fetch() call throws at once.
export const TRAP_MESSAGE = 'network disabled by test.mjs';
globalThis.fetch = () => { throw new Error(TRAP_MESSAGE); };
