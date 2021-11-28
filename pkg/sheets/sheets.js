const { GoogleSpreadsheet } = require("google-spreadsheet");
const { parseResponseBody } = require("./parser.js");

// https://docs.google.com/spreadsheets/d/1tpbLmB4Fha_0TpMd4h3d2xmpf_GztvpFP_DFmdaOHfM/edit#gid=699722627
const SPREADSHEET_ID = "1tpbLmB4Fha_0TpMd4h3d2xmpf_GztvpFP_DFmdaOHfM";
const ROW_START = 3;
const ROW_END = 203;
const COL_START = 1;
const COL_END = 18;

let doc;

const initializeSpreadsheetClient = async () => {
    doc = new GoogleSpreadsheet(SPREADSHEET_ID);
    await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY,
    });

    await doc.loadInfo();
    console.log("Successfully initialized Google Spreadsheet Client", doc.title);
};

// Updates row 1 containing name
const updateSheetMetadata = async (sheet) => {
    await sheet.loadCells(["F1", "M1"]);
    sheet.getCellByA1("F1").value = "Automatic";
    sheet.getCellByA1("M1").value = new Date().toUTCString();
}

const newFromTemplate = async (newSheetName) => {
    await doc.sheetsByTitle["Template"].copyToSpreadsheet(SPREADSHEET_ID);
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

// updateSpreadsheet receives /load/index response body
// 1. Attempts to find if sheet already exists and updates it
// 2. If not found, create new sheet from Template sheet and update it
const updateSpreadsheet = async (responseBody) => {
    const username = responseBody.user_info.user_name;

    // Do we need to create new sheet from template?
    await doc.loadInfo();
    if (!doc.sheetsByTitle[username]) {
        await newFromTemplate(username);
    }

    // Load relevant ranges
    const sheet = doc.sheetsByTitle[username];
    await sheet.loadCells({
        startRowIndex: ROW_START,
        endRowIndex: ROW_END,
        startColumnIndex: COL_START,
        endColumnIndex: COL_END,
    });

    // Wipe them
    for (let i = ROW_START; i < ROW_END; i++) {
        for (let j = COL_START; j < COL_END; j++) {
            const cell = sheet.getCell(i, j);
            cell.value = "";
        }
    }

    // Write data
    const data = parseResponseBody(responseBody);
    data.forEach((row, rowIndex) => {
        row.forEach((col, colIndex) => {
            const cellRow = ROW_START + rowIndex;
            const cellCol = COL_START + colIndex;
            const cell = sheet.getCell(cellRow, cellCol);
            cell.value = col;
        });
    });

    // Write metadata
    await updateSheetMetadata(sheet);

    // Send data
    return await sheet.saveUpdatedCells();
}


module.exports = {
    initializeSpreadsheetClient,
    updateSpreadsheet,
};