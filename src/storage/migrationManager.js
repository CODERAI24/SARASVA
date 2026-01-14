export function migrateData(data) {
  if (!data || !data.meta) return data;

  // 🔐 Phase 5.10 – safety migration (non-versioned)
  if (!Array.isArray(data.subjects)) {
    data.subjects = [];
  }

  const version = data.meta.schemaVersion;

  switch (version) {
    case 1:
      // current version – no structural migration needed
      return data;

    default:
      console.warn("Unknown schema version");
      return data;
  }
}
