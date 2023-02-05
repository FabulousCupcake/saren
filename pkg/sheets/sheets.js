const { GoogleSpreadsheet } = require("google-spreadsheet");
const { clanConfigs } = require("../config/config");

const METHOD_VERSION_MAP = {
    "1": require("./v1.js"),
    "2": require("./v2.js"),
};

const docs = {};

const initializeSpreadsheetClient = async () => {
    // Populate docs/client list
    clanConfigs.forEach(clan => {
        docs[clan.name] = new GoogleSpreadsheet(clan.spreadsheetId);
    });

    // Initialize clients
    for (const key in docs) {
        const doc = docs[key];

        await doc.useServiceAccountAuth({
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY,
        });
        await doc.loadInfo();

        console.log("Successfully initialized Google Spreadsheet Client", doc.title);
    }
};

const newFromTemplate = async (doc, newSheetName) => {
    await doc.sheetsByTitle["Template"].copyToSpreadsheet(doc.spreadsheetId);
    await doc.loadInfo();
    await doc.sheetsByTitle["Copy of Template"].updateProperties({
        title: newSheetName,
    });
    await doc.loadInfo();

    // Update name on B1
    const sheet = doc.sheetsByTitle[newSheetName];
    await sheet.loadCells("B1");
    sheet.getCellByA1("B1").value = newSheetName;
    await sheet.saveUpdatedCells();
}

const getSheetMethods = async (clanName) => {
    const version = clanConfigs.find(c => c.name == clanName).spreadsheetVersion;
    console.log("version", version)
    console.log("reval", METHOD_VERSION_MAP[version])
    return METHOD_VERSION_MAP[version];
}

// updateSpreadsheet receives /load/index response body
// 1. Attempts to find if sheet already exists and updates it
// 2. If not found, create new sheet from Template sheet and update it
const updateSpreadsheet = async (clanName, responseBody) => {
    const doc = docs[clanName];
    const username = responseBody.user_info.user_name;

    // Create new from Template if non-existent
    doc.resetLocalCache()
    await doc.loadInfo();
    if (!doc.sheetsByTitle[username]) {
        await newFromTemplate(doc, username);
    }

    // Update accordingly with correct clan sheet version
    const sheet = doc.sheetsByTitle[username];
    const { updateSheet } = getSheetMethods(clanName);
    console.log("updateSheet", updateSheet)
    await updateSheet(sheet, responseBody);

    // Send data
    return await sheet.saveUpdatedCells();
}

module.exports = {
    initializeSpreadsheetClient,
    updateSpreadsheet,
};