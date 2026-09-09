"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quoteSyncRoutes = void 0;
const express_1 = require("express");
const quote_controller_1 = require("../controllers/quote.controller");
exports.quoteSyncRoutes = (0, express_1.Router)();
// No archived customers
exports.quoteSyncRoutes.post("/sync", quote_controller_1.quoteSyncController.syncActiveQuotes);
// User decides whether archived customers are included
exports.quoteSyncRoutes.post("/sync/all", quote_controller_1.quoteSyncController.syncQuotes);
