import * as func from "../../lib/func.js";
const CD = new Set();

// === OP剑 === //
mc.listen("onAttackEntity", (player, entity) => {
    if (!(!CD.has(player.xuid)
        && player.isOP()
        && player.isSneaking
        && player.getHand()?.getNbt()?.getTag("tag")?.getData("isOP")
    )) return;
    CD.add(player.xuid);
    setTimeout(() => CD.delete(player.xuid), 20);

    switch (entity.type) {
        case "qys:message": // 留言纸船
            player.sendModalForm(
                "留言纸船", "[OP管理] 是否删除？",
                "§c立刻删除§r", "§a我再想想§r",
                (pl, ui) => {
                    if (ui) entity.despawn();
                });
            break;

        default:
            entity.despawn();
            break;
    }
    return false;
})

mc.listen("onUseItemOn", (player, item, entity, block, side, pos) => {
    if (!(!CD.has(player.xuid)
        && player.isOP()
        && player.getHand()?.getNbt()?.getTag("tag")?.getData("isOP")
    )) return;
    
    CD.add(player.xuid);
    setTimeout(() => CD.delete(player.xuid), 20);

    if (player.isSneaking) player.setGameMode(player.gameMode === 0 ? 1 : 0);
})






