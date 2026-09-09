"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const roles_route_1 = require("./routes/roles.route");
const users_route_1 = require("./routes/users.route");
const auth_routes_1 = require("./routes/auth.routes");
const companies_route_1 = require("./routes/companies.route");
const integrations_route_1 = require("./routes/integrations.route");
const job_routes_1 = require("./routes/job.routes");
const customer_routes_1 = require("./routes/customer.routes");
dotenv_1.default.config();
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
];
// ✅ Dynamic CORS handling
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true); // allow request
        }
        else {
            console.log("❌ Blocked by CORS:", origin);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};
const app = (0, express_1.default)();
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.urlencoded({ extended: true }));
app.get("/", (_, res) => {
    res.status(200).json({ message: "Api is healthy ..." });
});
// routes
app.use("/api/v1/auth", auth_routes_1.authRoutes);
app.use("/api/v1/users", users_route_1.userRoutes);
app.use("/api/v1/companies", companies_route_1.companyRoutes);
app.use("/api/v1/roles", roles_route_1.roleRoutes);
app.use("/api/v1/integrations", integrations_route_1.integrationRoutes);
app.use("/api/v1/jobs", job_routes_1.jobSyncRoutes);
app.use("/api/v1/customers", customer_routes_1.customerSyncRoutes);
const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`✅ App running on http://localhost:${port}`);
});
