// Indexed from 0, start inclusive, end exclusive
const CHARA_ROW_START = 3 // Row 4
const CHARA_COL_START = 1 // Col B
const MATS_ROW_START = 3  // Row 4
const MATS_COL_START = 20 // Col U

const ROW_START = 3; // Row 4
const ROW_END = 203; // Row 204
const COL_START = 1; // Col B
const COL_END  = 20;  // Col U

// List of notable items
const NOTABLE_MATERIALS = {
  "90005": "Divine Amulet",
  "90002": "Dungeon Coins",
  "90003": "Arena Coins",
  "90004": "Princess Arena Coins",
  "90006": "Clan Coins",
  "90008": "Master Coins",
  "90007": "Rupies",

  "20001": "Mini EXP Potion",
  "20002": "EXP Potion",
  "20003": "Super EXP Potion",
  "20004": "Mega EXP Potion",
  "20005": "Giga EXP Potion",

  "22001": "Refinement Crystal",
  "22002": "Enhanced Refinement Crystal",
  "22003": "Superior Refinement Crystal",

  // "21900": "Growth Sphere 180",
  // "21901": "Growth Sphere 215",
  // "21902": "Growth Sphere 250",
  // "21903": "Growth Sphere 100",

  "25001": "Princess Orb",
}

const NOTABLE_EQUIPMENTS = {
  "140000": "Princess Heart",
  "140001": "Princess Heart (Fragment)"
}

// Simple helper function for parseCharacterData
const fetchBondLevel = (readStoryIds, charId) => {
  return readStoryIds
    .map(id => id.toString())
    .filter(id => id.substr(0, 4) == charId)
    .map(id => parseInt(id.substr(4, 3), 10))
    .reduce((a, b) => Math.max(a, b), 0);
}

// Parses response body (from ingame / lambda) for character data
const parseCharacterData = (resBody) => {
  const fetchShardAmount = (charId) => resBody.item_list.find((i) => i.id == `3${charId}`)?.stock || 0;
  const fetchPureShardAmount = (charId) => resBody.item_list.find((i) => i.id == `3${charId+1000}`)?.stock || 0;
  const normalizeEquipRefineLevel = (eq) => !eq.is_slot ? -1 : eq.enhancement_level;

  const units = resBody.unit_list;
  const readStoryIds = resBody.read_story_ids;

  const result = units.map((u) => {
    const id = parseInt(u.id.toString().substr(0, 4), 10);
    const level = u.unit_level;
    const star = u.unit_rarity;
    const shard = fetchShardAmount(id);
    const pureShard = fetchPureShardAmount(id);
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
      pureShard,
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

// Parses response body (from ingame / lambda) for material data
const parseMaterialData = (resBody) => {
  const resultRows = [];

  // Add items
  for (const [key, val] of NOTABLE_MATERIALS) {
    const name = val;
    const amount = resBody.item_list.find(i => i.id == key)?.stock || 0;

    resultRows.push({ name, amount });
  }

  // Add equipments
  for (const [key, val] of NOTABLE_EQUIPMENTS) {
    const name = val;
    const amount = resBody.user_equip.find(i => i.id == key)?.stock || 0;

    resultRows.push({ name, amount });
  }

  // Add specials
  resultRows.push({ name: "Mana (Free)", amount: resBody.user_gold.gold_id_free });
  resultRows.push({ name: "Jewel (Free)", amount: resBody.user_jewel.free_jewel });
  resultRows.push({ name: "Account EXP", amount: resBody.user_info.team_exp });

  return resultRows;
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

  // Write Character Data
  const charaData = parseCharacterData(responseBody);
  charaData.forEach((row, rowIndex) => {
    row.forEach((col, colIndex) => {
      const cellRow = CHARA_ROW_START + rowIndex;
      const cellCol = CHARA_COL_START + colIndex;
      const cell = sheet.getCell(cellRow, cellCol);
      cell.value = col;
    });
  });

  // Write Materials Data
  const matsData = parseMaterialData(responseBody);
  matsData.forEach(row, rowIndex => {
    const cellRow = MATS_ROW_START + rowIndex;
    const nameCell = sheet.getCell(cellRow, MATS_COL_START);
    const amountCell = sheet.getCell(cellRow, MATS_COL_START + 1);

    nameCell.value = row.name;
    amountCell.value = row.amount;
  });

  // Write metadata
  await updateSheetMetadata(sheet);

  // Send data
  return await sheet.saveUpdatedCells();
}

module.exports = {
  updateSheet,
}