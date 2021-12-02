const parseResponseBody = (resBody) => {
    const fetchShardAmount = (charId) => resBody.item_list.find((i) => i.id == `3${charId}`)?.stock || 0;
    const fetchBondLevel = (charId) => resBody.user_chara_info.find((i) => i.chara_id == charId)?.love_level || 0;
    const normalizeEquipRefineLevel = (eq) => !eq.is_slot ? -1 : eq.enhancement_level;

    const units = resBody.unit_list;
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
      const bond = fetchBondLevel(id);

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

module.exports = {
    parseResponseBody,
};