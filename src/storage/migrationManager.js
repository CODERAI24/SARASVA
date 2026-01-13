export function migrateData(data) {
  if (!data || !data.meta) return data;

  const version = data.meta.schemaVersion;

  switch (version) {
    case 1:
      // current version – no migration needed
      return data;

    default:
      console.warn("Unknown schema version");
      return data;
  }
}
