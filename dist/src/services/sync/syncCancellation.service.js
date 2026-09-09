"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSync = registerSync;
exports.cancelSyncJob = cancelSyncJob;
exports.unregisterSync = unregisterSync;
const activeSyncs = new Map();
function registerSync(syncId) {
    const controller = new AbortController();
    activeSyncs.set(syncId, controller);
    return controller;
}
function cancelSyncJob(syncId) {
    const controller = activeSyncs.get(syncId);
    if (!controller)
        return false;
    controller.abort();
    return true;
}
function unregisterSync(syncId) {
    activeSyncs.delete(syncId);
}
