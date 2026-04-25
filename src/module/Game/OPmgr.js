// import dts
/// <reference path="/root/VSCode/Library/LSE/index.d.ts"/>

import * as func from "./lib/func.js";

// === OP剑 === //
mc.listen("onAttackEntity", (player, entity) => {
    if (!(player.isOP()
        && player.isSneaking
        && player.getHand()?.getNbt()?.getTag("tag")?.getData("isOP")
    )) return;

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
})

mc.listen("onUseItemOn", (player, item, entity, block, side, pos) => {
    if (!(player.isOP()
        && player.getHand()?.getNbt()?.getTag("tag")?.getData("isOP")
    )) return;

    if (player.isSneaking) player.setGameMode(player.gameMode === 0 ? 1 : 0);
})






