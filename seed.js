const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");

const User = require("./models/User");
const Batch = require("./models/Batch");
const Test = require("./models/Test");
const ManualTest = require("./models/ManualTest");
const AuditLog = require("./models/AuditLog");

dotenv.config();

const seedDatabase = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/food_lab_management");
        console.log("Connected to MongoDB");

        // Clear existing collections
        console.log("Clearing existing collections...");
        await User.deleteMany({});
        await Batch.deleteMany({});
        await Test.deleteMany({});
        await ManualTest.deleteMany({});
        await AuditLog.deleteMany({});

        // 1. Create demo users with hashed passwords
        console.log("Seeding demonstration user accounts...");
        const usersToCreate = [
            { username: "admin", password: "admin123", role: "Admin" },
            { username: "labmanager", password: "manager123", role: "Lab Manager" },
            { username: "analyst", password: "analyst123", role: "Lab Analyst" },
            { username: "technician", password: "tech123", role: "Lab Technician" },
            { username: "qa_lead", password: "quality123", role: "Quality Manager" },
            { username: "production", password: "prod123", role: "Production Staff" },
            { username: "prod_manager", password: "prodmgr123", role: "Production Manager" },
            { username: "viewer", password: "viewer123", role: "Viewer" }
        ];

        const usersMap = {};
        for (const u of usersToCreate) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(u.password, salt);
            const created = await User.create({
                username: u.username,
                password: hashedPassword,
                role: u.role
            });
            usersMap[u.username] = created;
        }
        console.log(`Created ${Object.keys(usersMap).length} user accounts.`);

        // 2. Create sample food batches
        console.log("Seeding sample food product batches...");
        const now = new Date();

        const batch1 = await Batch.create({
            batchId: "BATCH-2026-001",
            productName: "Pasteurized Whole Milk",
            productCategory: "Dairy Products",
            manufacturer: "PureDairy Farms Ltd",
            quantity: 5000,
            unit: "Liters",
            manufacturingDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            expiryDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
            receivedDate: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
            description: "Grade A raw milk, HTST pasteurized at 72°C for 15s. Requires chilled storage below 4°C.",
            status: "Approved"
        });

        const batch2 = await Batch.create({
            batchId: "BATCH-2026-002",
            productName: "Organic Cloudy Apple Juice",
            productCategory: "Beverages",
            manufacturer: "Orchard Fresh Botanicals",
            quantity: 2500,
            unit: "Bottles (1L)",
            manufacturingDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
            expiryDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
            receivedDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
            description: "Cold-pressed gala apples without added preservative. Flash pasteurized.",
            status: "Under Testing"
        });

        const batch3 = await Batch.create({
            batchId: "BATCH-2026-003",
            productName: "Fortified Wheat Flour",
            productCategory: "Grains & Cereals",
            manufacturer: "Golden Grain Mills",
            quantity: 10000,
            unit: "kg",
            manufacturingDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
            expiryDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
            receivedDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
            description: "Enriched with Iron, Zinc, Folic Acid, and B-vitamins. Moisture controlled bag packaging.",
            status: "Pending"
        });

        const batch4 = await Batch.create({
            batchId: "BATCH-2026-004",
            productName: "Yellowfin Tuna Steaks in Brine",
            productCategory: "Canned Seafood & Meat",
            manufacturer: "Ocean Harvest Packaging",
            quantity: 1200,
            unit: "Cans (200g)",
            manufacturingDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
            expiryDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
            receivedDate: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
            description: "Wild-caught yellowfin tuna in natural salt brine. Pressure retorted.",
            status: "Rejected"
        });

        const batch5 = await Batch.create({
            batchId: "BATCH-2026-005",
            productName: "Creamy Roasted Peanut Butter",
            productCategory: "Spreads & Condiments",
            manufacturer: "NutriBites Confectionery",
            quantity: 800,
            unit: "Jars (500g)",
            manufacturingDate: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
            expiryDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000), // Expiring in 8 days
            receivedDate: new Date(now.getTime() - 110 * 24 * 60 * 60 * 1000),
            description: "Aflatoxin screened roasted peanuts, non-hydrogenated palm oil stabilizer.",
            status: "Approved"
        });

        console.log("Batches created successfully.");

        // 3. Create sample quality and chemical tests
        console.log("Seeding sample laboratory tests...");

        // Milk Chemical & Microbiology Test (Approved)
        await Test.create({
            testId: "TEST-2026-001",
            batch: batch1._id,
            testName: "Milk Composition & Microbiological Safety Assay",
            sampleName: "Tanker #1 Top & Bottom Composite Specimen",
            productName: batch1.productName,
            testType: "Chemical & Microbiological Analysis",
            phValue: 6.7,
            moisturePercentage: 87.5,
            chemicalAnalysisResults: "Fat: 3.8%, Acidity: 0.14%, Protein: 3.2%, Antibiotic residue: None detected.",
            microbiologicalTestResults: "TPC: 4,500 cfu/ml (limit < 30,000), Coliform: 0 cfu/ml, Salmonella: Negative.",
            parameters: [
                { parameterName: "Fat Content", standardRange: "3.5 - 4.5", minValue: 3.5, maxValue: 4.5, observedValue: 3.8, unit: "%", status: "Pass" },
                { parameterName: "Acidity (Lactic Acid)", standardRange: "0.13 - 0.17", minValue: 0.13, maxValue: 0.17, observedValue: 0.14, unit: "%", status: "Pass" },
                { parameterName: "pH Level", standardRange: "6.6 - 6.8", minValue: 6.6, maxValue: 6.8, observedValue: 6.7, unit: "pH", status: "Pass" }
            ],
            overallResult: "Approved",
            testedBy: usersMap["analyst"]._id,
            reviewedBy: usersMap["qa_lead"]._id,
            remarks: "All analytical and hygienic parameters conform strictly with regulatory limits. Released for distribution."
        });

        // Apple Juice Chemical Test (Under Review)
        await Test.create({
            testId: "TEST-2026-002",
            batch: batch2._id,
            testName: "Juice Brix & Organic Acid Profile",
            sampleName: "Filling Station Line 2 Bottle Specimen",
            productName: batch2.productName,
            testType: "Chemical Analysis",
            phValue: 3.5,
            moisturePercentage: 86.8,
            chemicalAnalysisResults: "Brix: 12.2°, Malic acid: 0.48%, Patulin: 12 µg/kg (regulatory limit < 50 µg/kg).",
            microbiologicalTestResults: "Yeast & Mold count pending 48h incubation readout.",
            parameters: [
                { parameterName: "Total Soluble Solids (Brix)", standardRange: "11.0 - 13.0", minValue: 11.0, maxValue: 13.0, observedValue: 12.2, unit: "°Brix", status: "Pass" },
                { parameterName: "pH Level", standardRange: "3.3 - 3.8", minValue: 3.3, maxValue: 3.8, observedValue: 3.5, unit: "pH", status: "Pass" }
            ],
            overallResult: "Under Review",
            testedBy: usersMap["technician"]._id,
            remarks: "Physicochemical specifications nominal. Awaiting QA Manager final sign-off."
        });

        // Tuna Heavy Metals & Contaminants Test (Rejected)
        await Test.create({
            testId: "TEST-2026-003",
            batch: batch4._id,
            testName: "Seafood Histamine & Toxic Trace Metals Assay",
            sampleName: "Sealed Retort Can Lot #TN-03",
            productName: batch4.productName,
            testType: "Heavy Metals & Contaminants",
            phValue: 6.1,
            moisturePercentage: 68.2,
            chemicalAnalysisResults: "Histamine content: 88 ppm (safety limit max 50 ppm). Lead (Pb): 0.04 mg/kg.",
            microbiologicalTestResults: "Commercial sterility confirmed.",
            parameters: [
                { parameterName: "Histamine Content", standardRange: "< 50", maxValue: 50, observedValue: 88, unit: "ppm", status: "Fail" },
                { parameterName: "Methylmercury (Hg)", standardRange: "< 0.5", maxValue: 0.5, observedValue: 0.22, unit: "mg/kg", status: "Pass" }
            ],
            overallResult: "Rejected",
            testedBy: usersMap["analyst"]._id,
            reviewedBy: usersMap["qa_lead"]._id,
            rejectionReason: "Critical scombroid food safety risk: Histamine concentration of 88 ppm exceeds maximum regulatory threshold of 50 ppm.",
            remarks: "Batch quarantined immediately. Product destruction protocol initiated."
        });

        console.log("Laboratory tests created successfully.");

        // 4. Create sample audit logs
        console.log("Seeding audit trail...");
        await AuditLog.create([
            {
                action: "CREATE_BATCH",
                entityType: "Batch",
                entityId: String(batch1._id),
                performedBy: usersMap["production"]._id,
                details: { batchId: batch1.batchId, productName: batch1.productName }
            },
            {
                action: "CREATE_TEST",
                entityType: "Test",
                entityId: "TEST-2026-001",
                performedBy: usersMap["analyst"]._id,
                details: { testId: "TEST-2026-001", batchId: batch1.batchId }
            },
            {
                action: "REVIEW_TEST",
                entityType: "Test",
                entityId: "TEST-2026-001",
                performedBy: usersMap["qa_lead"]._id,
                details: { testId: "TEST-2026-001", verdict: "Approved", batchUpdated: true }
            },
            {
                action: "REVIEW_TEST",
                entityType: "Test",
                entityId: "TEST-2026-003",
                performedBy: usersMap["qa_lead"]._id,
                details: { testId: "TEST-2026-003", verdict: "Rejected", rejectionReason: "Histamine 88 ppm", batchUpdated: true }
            }
        ]);

        console.log("Audit log records created.");
        console.log("\n==========================================");
        console.log("   FOOD LAB DATABASE SEEDING COMPLETE!    ");
        console.log("==========================================");
        console.log("Accounts ready:");
        console.log("  - Admin:              admin / admin123");
        console.log("  - Lab Manager:        labmanager / manager123");
        console.log("  - Lab Analyst:        analyst / analyst123");
        console.log("  - Lab Technician:     technician / tech123");
        console.log("  - Quality Manager:    qa_lead / quality123");
        console.log("  - Production Staff:   production / prod123");
        console.log("  - Production Manager: prod_manager / prodmgr123");
        console.log("  - Viewer:             viewer / viewer123");
        console.log("==========================================\n");

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
};

seedDatabase();
