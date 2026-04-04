const mobList = new Set(["minecraft:tropicalfish", "minecraft:squid", "minecraft:salmon", "minecraft:glow_squid", "minecraft:cod"]);

mc.listen("onMobHurt", (mob, source) => {
    if (mobList.has(mob?.type)
        && source?.type === "minecraft:axolotl"
        && source?.hasTag("naa:no_axolotl_damage")
    ) return false;
})

mc.listen("onAttackEntity", (pl, en) => {
    if (!(pl?.isSneaking && en?.type === "minecraft:axolotl" && LandJudgment(pl, en.pos))) return;
    pl.sendModalForm("美西螈设置",
      "设置你的美西螈是否拦截攻击鱼动作\n当前状态：" + en.hasTag("naa:no_axolotl_damage"),
      "§atrue", "§cfalse",
    (pl, res) => {
        if (res === null) return;
        res ? en.addTag("naa:no_axolotl_damage") : en.removeTag("naa:no_axolotl_damage");
        pl.tell("功能 noAxolotlDamage 设置为 " + res);
    })
    return false;
})


/**
 * 判断是否有权限
 * 来自沐佬的搬运插件
 * @param {Player} Player 玩家对象
 * @param {IntPos} Pos 方块的坐标对象
 */
function LandJudgment(Player, Pos) {
    const toRawPos = (Pos) => ({
        'x': Pos.x,
        'y': Pos.y,
        'z': Pos.z,
        'dimid': Pos.dimid
    });
    if (ll.hasExported('ILAPI_PosGetLand')) {// iLand，魔改版接口好像都没动，就写一个应该可以吧 https://www.minebbs.com/resources/iland-gui-50-api.2162/
        /** 领地ID @type {Number} */
        let LandId = ll.imports('ILAPI_PosGetLand')(toRawPos(Pos));
        if (LandId != -1 &&
            !(
                ll.imports('ILAPI_IsLandOwner')(LandId, Player.xuid)// 领地主人
                || ll.imports('ILAPI_IsLandOperator')(Player.xuid)// 领地管理
                || ll.imports('ILAPI_IsPlayerTrusted')(LandId, Player.xuid)// 被信任的
            )
        ) return false;
    }
    if (ll.hasExported("PLand_LDAPI", "PLand_getLandAt")) {// PLand
        /** 领地ID @type {Number} */
        let LandId = ll.imports('PLand_LDAPI', "PLand_getLandAt")(Pos);
        if (
            LandId != -1
            && ll.imports("PLand_LDAPI", "PLand_getPermType")(Player.uuid, LandId, false) == 3
        ) return false;
    }
    return true;
}
