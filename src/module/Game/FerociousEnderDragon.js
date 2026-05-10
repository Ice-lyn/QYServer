import * as func from "../../lib/func.js";

const rystalTimeout = new Set();
const playerDamage = {};


// === 代办 === //
/**
 * 修改末影龙最大生命值 1000                 ok
 * 修改末影龙伤害                           ok
 * 末地水晶被破坏一段时间后自动恢复            ok
 * 末影龙歇息时伤害减少                      ok
 * 末影龙使用爆炸攻击
 * 末影龙使用雷电攻击
 * 末影龙召唤小弟战斗（默认凋灵骷髅，可修改）     ok
 * 末影龙仅受到玩家伤害（免疫爆炸）             ok
 * 末影龙使用状态效果攻击
 * 水晶被破坏时奖励破坏者debuff              ok
 * 击杀末影龙后奖励按照伤害百分比分配          ok
 * 末影龙击杀玩家后回复生命值                 ok
 */


// 末影龙受伤
mc.listen("onMobHurt", (mob, source, damage, cause) => {
    if (mob.type === "minecraft:ender_dragon") {
        if (cause === ActorDamageCause.BlockExplosion // 拦截爆炸伤害
            || cause === ActorDamageCause.EntityExplosion
        ) return false;

        // 有45%的机率摇人
        if (func.probability(30)) {
            for (let i = 0; i < 5; i++) {
                func.enRuncmd(mob, "execute as @a[r=500] at @s run structure load 末影侍卫 ~~~");
            }
        }
    }
})

// 玩家破坏水晶
mc.listen("onAttackEntity", (player, entity) => {
    if (!(entity.type === "ender_crystal"
        && entity.pos.dimid === 2
    )) return;

    // 奖励破坏者debuff
    [2, 9, 15, 17, 20].forEach(id => player.addEffect(id, 10, 1, true));

    // 末影水晶自动恢复
    const rystalDamage = setTimeout(() => {
        mc.runcmdEx(`execute in the_end positioned ${func.pos2str(entity.pos)} run summon ender_crystal`);
        rystalTimeout.delete(rystalDamage);
    }, 120 * 1000);
    rystalTimeout.add(rystalDamage);
})



// 生物被末影龙杀死
mc.listen("onMobDie", (entity, source) => {
    if (!(source.type === "minecraft:ender_dragon"
        && entity?.type === "minecraft:player"
    )) return;
    source.heal(10);
    func.enRuncmd(source, 'tellraw @a[r=100] {"rawtext":[{"text": "§d末影龙吞噬了 "},{"selector":"@s"},{"text":" 的血量！§r"}]}');
})

// 末影龙死亡
mc.listen("onMobDie", (mob) => {
    if (mob.type !== "minecraft:ender_dragon") return;

    mc.setBlock(0, 64, 0, 2, "minecraft:dragon_egg");
    mc.runcmdEx("playsound mob.enderdragon.death @a");
    rystalTimeout.clear();

    let index = 1;
    playerDamageList
        .sort((a, b) => a[1] - b[1])
        .forEach(([damage, xuid]) => {
            const player = mc.getPlayer(xuid) ?? null;
            const anking = 10 - index;

            if (func.isNull(player)) return;

            // 物品
            player.giveItem("minecraft:netherite_ingot", anking * 5);

            // 经济奖励
            player.addScore("蜡烛", anking * 3000);
            player.addScore("金币", anking * 1000);

            // 称号
            if (player.hasTag("tag:§r§l§5屠§d龙§b勇§3士§r")) {
                func.enRuncmd(player, "function tag/tag4");
                mc.broadcast(`${player.realName} 完成了进度 §d[解放末地]§r`);
            }

            playerDamage.delete(xuid);
            index++;
        });
})