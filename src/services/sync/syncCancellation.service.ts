const activeSyncs = new Map<string, AbortController>();

export function registerSync(syncId: string): AbortController {
  const controller = new AbortController();
  activeSyncs.set(syncId, controller);
  return controller;
}

export function cancelSyncJob(syncId: string): boolean {
  const controller = activeSyncs.get(syncId);
  if (!controller) return false;
  controller.abort();
  return true;
}

export function unregisterSync(syncId: string) {
  activeSyncs.delete(syncId);
}
