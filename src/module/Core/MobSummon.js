import { Minecraft } from '../../../../GMLIB-LegacyRemoteCallApi/lib/GMLIB_API-JS.js';
import * as func from "../../lib/func.js";

// 白名单
const canEntitySet = new Set([
    "minecrft:player",
    "minecraft:villager",
    "minecraft:villager_v2",
    "minecraft:zombie_villager",
    "minecraft:zombie_villager_v2",
    "minecraft:item"
]);

// 生物尝试生成
mc.listen("onMobTrySpawn", (type, pos) => {
    if (canEntitySet.has(type)) return;

    if (Minecraft.getServerAverageTps() >= 18) return;
    if (Minecraft.getServerAverageTps() <= 9) return false;

    // 刷怪塔
    if (pos.y >= 64) return;

    // 如果20格内没有玩家
    if (mc.getEntities(pos, 20).some(i => i.type === "minecraft:player")) return;

    return false;
})

// 执行后台指令
mc.listen("onConsoleCmd", (cmd) => {
    if (!cmd.startsWith("testfor")) return;

    cmd = cmd.split(" ");
    switch (cmd[1]) {
        // 所有实体类型
        case "--type":
            const allEntity = mc.getAllEntities();
            let typeList = {};

            allEntity.forEach(en => typeList[en.type] = (typeList[en.type] ?? 0) + 1);
            typeList =  Object.keys(typeList)
                .sort((a, b) => typeList[b] - typeList[a])
                .reduce((acc, key) => {
                    acc[key] = typeList[key];
                    return acc;
                }, {});

            logger.info(
                `AllEntity: ${allEntity.length}\n`,
                JSON.stringify(typeList, null, 4)
            );
            return false;

        // 玩家附件实体
        case "--player":
            mc.getOnlinePlayers()
                .forEach(player =>
                    logger.info(`${player.realName} -> ${func.enRuncmd(player, `testfor @e[r=${cmd[2] ?? 160}]`).output?.split(", ")?.length}`)
                );
            return false;
    }
})
