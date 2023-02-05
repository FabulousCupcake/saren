// Indexed from 0, start inclusive, end exclusive
const ROW_START = 3; // Row 4
const ROW_END = 203; // Row 203
const COL_START = 1; // Column B
const COL_END = 18;  // Column Q

// Simple helper function for parseResponseBody
const fetchBondLevel = (readStoryIds, charId) => {
  return readStoryIds
    .map(id => id.toString())
    .filter(id => id.substr(0, 4) == charId)
    .map(id => parseInt(id.substr(4, 3), 10))
    .reduce((a, b) => Math.max(a, b), 0);
}

// Parses repsonse body (from ingame / lambda)
const parseResponseBody = (resBody) => {
  const fetchShardAmount = (charId) => resBody.item_list.find((i) => i.id == `3${charId}`)?.stock || 0;
  const normalizeEquipRefineLevel = (eq) => !eq.is_slot ? -1 : eq.enhancement_level;

  const units = resBody.unit_list;
  const readStoryIds = resBody.read_story_ids;

  const result = units.map((u) => {
    const id = parseInt(u.id.toString().substr(0, 4), 10);
    const level = u.unit_level;
    const star = u.unit_rarity;
    const shard = fetchShardAmount(id);
    const rank = u.promotion_level;
    const eq1 = normalizeEquipRefineLevel(u.equip_slot[0]);
    const eq2 = normalizeEquipRefineLevel(u.equip_slot[1]);
    const eq3 = normalizeEquipRefineLevel(u.equip_slot[2]);
    const eq4 = normalizeEquipRefineLevel(u.equip_slot[3]);
    const eq5 = normalizeEquipRefineLevel(u.equip_slot[4]);
    const eq6 = normalizeEquipRefineLevel(u.equip_slot[5]);
    const ub = u.union_burst[0].skill_level;
    const sk1 = u.main_skill?.[0]?.skill_level || 0;
    const sk2 = u.main_skill?.[1]?.skill_level || 0;
    const ex = u.ex_skill?.[0]?.skill_level || 0;
    const ue = u.unique_equip_slot[0]?.enhancement_level || 0;
    const bond = fetchBondLevel(readStoryIds, id);

    // prettier-ignore
    const columns = [
      id,
      level,
      star,
      shard,
      rank,
      eq1,
      eq2,
      eq3,
      eq4,
      eq5,
      eq6,
      ub,
      sk1,
      sk2,
      ex,
      ue,
      bond,
    ];
    return columns;
  });

  return result;
};

// Updates row 1 containing name
const updateSheetMetadata = async (sheet) => {
  await sheet.loadCells(["F1", "M1"]);
  sheet.getCellByA1("F1").value = "Automatic";
  sheet.getCellByA1("M1").value = new Date().toUTCString();
}

// updateSpreadsheet updates sheet with data
const updateSheet = async (sheet, responseBody) => {
  // Load Cells
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

  // Parse response from lambda and write to sheet
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
  updateSheet,
}