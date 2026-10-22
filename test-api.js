const mongoose = require("mongoose");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");

dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const batchRoutes = require("./routes/batchRoutes");
const testRoutes = require("./routes/testRoutes");
const auditRoutes = require("./routes/auditRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/audit-logs", auditRoutes);

async function runTestSuite() {
    console.log("==========================================");
    console.log("   FOOD LAB MANAGEMENT API TEST SUITE     ");
    console.log("==========================================\n");

    try {
        await connectDB();
        console.log("✔ Connected to MongoDB successfully.");

        // Start server on an ephemeral free port
        const server = app.listen(0);
        const port = server.address().port;
        const baseUrl = `http://127.0.0.1:${port}`;
        console.log(`✔ Test server listening on ${baseUrl}`);

        // Helper fetch wrapper
        const request = async (endpoint, method = "GET", body = null, token = null) => {
            const headers = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch(`${baseUrl}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null
            });
            const data = await res.json().catch(() => null);
            return { status: res.status, data };
        };

        // 1. Test Admin Login
        console.log("\n[Test 1] Logging in as Admin...");
        const loginRes = await request("/api/auth/login", "POST", {
            username: "admin",
            password: "admin123"
        });
        if (loginRes.status !== 200 || !loginRes.data.token) {
            throw new Error(`Admin login failed: ${JSON.stringify(loginRes.data)}`);
        }
        const adminToken = loginRes.data.token;
        console.log(`✔ Admin login successful. Role: ${loginRes.data.user.role}`);

        // 2. Test Me Endpoint (JWT Verification)
        console.log("\n[Test 2] Testing /api/auth/me token verification...");
        const meRes = await request("/api/auth/me", "GET", null, adminToken);
        if (meRes.status !== 200 || meRes.data.user.username !== "admin") {
            throw new Error(`Auth me failed: ${JSON.stringify(meRes.data)}`);
        }
        console.log(`✔ Auth verification passed for user: ${meRes.data.user.username}`);

        // 3. Test Batch Creation
        console.log("\n[Test 3] Creating a new food batch...");
        const testBatchId = `E2E-BATCH-${Date.now().toString().slice(-5)}`;
        const batchRes = await request("/api/batches", "POST", {
            batchId: testBatchId,
            productName: "End-to-End Test Honey Jar",
            productCategory: "Spreads & Condiments",
            manufacturer: "API Automation Facility",
            quantity: 350,
            unit: "Jars (250g)",
            manufacturingDate: new Date(),
            expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
        }, adminToken);

        if (batchRes.status !== 201) {
            throw new Error(`Batch creation failed: ${JSON.stringify(batchRes.data)}`);
        }
        const createdBatch = batchRes.data.batch;
        console.log(`✔ Batch created: ${createdBatch.batchId} (${createdBatch.productName}), Status: ${createdBatch.status}`);

        // 4. Test Expiry Monitoring Endpoint
        console.log("\n[Test 4] Querying expiry monitoring endpoint...");
        const expiryRes = await request("/api/batches/expiring?days=365", "GET", null, adminToken);
        if (expiryRes.status !== 200 || !Array.isArray(expiryRes.data.batches)) {
            throw new Error(`Expiry query failed: ${JSON.stringify(expiryRes.data)}`);
        }
        console.log(`✔ Expiry monitoring returned ${expiryRes.data.batches.length} batches within threshold.`);

        // 5. Test Quality / Chemical Test Creation
        console.log("\n[Test 5] Recording chemical analysis test...");
        const testTestId = `E2E-TEST-${Date.now().toString().slice(-5)}`;
        const testRes = await request("/api/tests", "POST", {
            testId: testTestId,
            batch: createdBatch._id,
            sampleName: "Sample #E2E-01",
            testType: "Chemical Analysis",
            parameters: [
                { parameterName: "Moisture Content", standardRange: "< 18.0", maxValue: 18.0, observedValue: 16.5, unit: "%" },
                { parameterName: "pH Level", standardRange: "3.5 - 4.5", minValue: 3.5, maxValue: 4.5, observedValue: 3.9, unit: "pH" }
            ],
            remarks: "Standard chemical evaluation passed."
        }, adminToken);

        if (testRes.status !== 201) {
            throw new Error(`Test creation failed: ${JSON.stringify(testRes.data)}`);
        }
        const createdTest = testRes.data.test;
        console.log(`✔ Lab test recorded: ${createdTest.testId}, Result: ${createdTest.overallResult}`);

        // 6. Test QA Review and Sign-Off
        console.log("\n[Test 6] Reviewing test and synchronizing batch status...");
        const reviewRes = await request(`/api/tests/${createdTest._id}/review`, "PATCH", {
            overallResult: "Pass",
            remarks: "All purity and moisture limits conform to safety criteria.",
            updateBatchStatus: true
        }, adminToken);

        if (reviewRes.status !== 200 || reviewRes.data.batch.status !== "Approved") {
            throw new Error(`Review test failed: ${JSON.stringify(reviewRes.data)}`);
        }
        console.log(`✔ Test review complete: Marked as Pass. Batch auto-updated to: ${reviewRes.data.batch.status}`);

        // 7. Test Certificate of Analysis (COA) / Traceability Endpoint
        console.log("\n[Test 7] Fetching Certificate of Analysis (COA)...");
        const coaRes = await request(`/api/batches/${createdBatch._id}/traceability`, "GET", null, adminToken);
        if (coaRes.status !== 200 || coaRes.data.traceability.complianceStatus !== "COMPLIANT") {
            throw new Error(`COA query failed: ${JSON.stringify(coaRes.data)}`);
        }
        console.log(`✔ Certificate of Analysis generated: ${coaRes.data.traceability.certificateOfAnalysis.certificateId}, Compliance: ${coaRes.data.traceability.complianceStatus}`);

        // 8. Test Regulatory Audit Trail
        console.log("\n[Test 8] Querying regulatory audit trail...");
        const auditRes = await request("/api/audit-logs?limit=10", "GET", null, adminToken);
        if (auditRes.status !== 200 || auditRes.data.logs.length === 0) {
            throw new Error(`Audit log query failed: ${JSON.stringify(auditRes.data)}`);
        }
        console.log(`✔ Audit log verified: ${auditRes.data.total} recorded events in database.`);

        // Clean up test batch & test
        await mongoose.connection.collection("batches").deleteOne({ _id: new mongoose.Types.ObjectId(createdBatch._id) });
        await mongoose.connection.collection("tests").deleteOne({ _id: new mongoose.Types.ObjectId(createdTest._id) });
        console.log("\n✔ Ephemeral test records cleaned up.");

        // Teardown
        server.close();
        await mongoose.connection.close();

        console.log("\n==========================================");
        console.log("   ALL 8 API TESTS PASSED SUCCESSFULLY!   ");
        console.log("==========================================\n");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ TEST FAILED:", error.message);
        process.exit(1);
    }
}

runTestSuite();
