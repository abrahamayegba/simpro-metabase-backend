"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncEntityConfigController = void 0;
const syncEntityConfig_service_1 = require("../services/sync/syncEntityConfig.service");
exports.syncEntityConfigController = {
    getEntities: async (req, res) => {
        try {
            const { companyId } = req.params;
            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: "companyId is required",
                });
            }
            const [syncEntities, csvEntities] = await Promise.all([
                (0, syncEntityConfig_service_1.getSyncEntities)(companyId, "Simpro"),
                (0, syncEntityConfig_service_1.getCsvEntities)(companyId),
            ]);
            return res.status(200).json({
                success: true,
                result: {
                    syncEntities,
                    csvEntities,
                },
            });
        }
        catch (error) {
            console.error("getSyncEntities error:", error);
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to get sync entities",
            });
        }
    },
};
