const parseResponseBody = (resBody) => {
    const fetchShardAmount = (charId) => resBody.item_list.find((i) => i.id == `3${charId}`)?.stock || 0;
    const fetchBondLevel = (charId) => resBody.user_chara_info.find((i) => i.chara_id == charId)?.love_level || 0;

    const units = resBody.unit_list;
    const result = units.map((u) => {
      const id = parseInt(u.id.toString().substr(0, 4), 10);
      const level = u.unit_level;
      const star = u.unit_rarity;
      const shard = fetchShardAmount(id);
      const rank = u.promotion_level;
      const eq1 = u.equip_slot[0].enhancement_level || 0;
      const eq2 = u.equip_slot[1].enhancement_level || 0;
      const eq3 = u.equip_slot[2].enhancement_level || 0;
      const eq4 = u.equip_slot[3].enhancement_level || 0;
      const eq5 = u.equip_slot[4].enhancement_level || 0;
      const eq6 = u.equip_slot[5].enhancement_level || 0;
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