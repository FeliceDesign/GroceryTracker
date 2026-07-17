// Ersetzt window.storage (nur in Claude-Artifacts vorhanden) durch echtes,
// persistentes localStorage mit identischem Rückgabeformat { key, value }.
// So kann der App-Code einheitlich gegen `window.storage` arbeiten – egal ob
// im Artifact-Prototyp, im Browser oder in der nativen App.

if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    async get(key) {
      const value = localStorage.getItem(key);
      if (value === null) return null;
      return { key, value };
    },
    async set(key, value) {
      localStorage.setItem(key, value);
      return { key, value };
    },
    async delete(key) {
      localStorage.removeItem(key);
      return { key, deleted: true };
    },
    async list(prefix = '') {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix));
      return { keys };
    },
  };
}
