import { LandJudgment } from "../../lib/func.js";
const mobList = new Set([
    "minecraft:tropicalfish",
    "minecraft:squid",
    "minecraft:salmon",
    "minecraft:glow_squid",
    "minecraft:cod"
]);

mc.listen("onMobHurt", (mob, source) => {
    if (mobList.has(mob?.type)
        && source?.type === "minecraft:axolotl"
        && source?.hasTag("naa:no_axolotl_damage")
    ) return false;
});

mc.listen("onAttackEntity", (pl, en) => {
    if (!(pl?.isSneaking
        && en?.type === "minecraft:axolotl"
        && LandJudgment(pl, en.pos)
    )) return;
    pl.sendModalForm("美西螈设置",
        "设置你的美西螈是否拦截攻击鱼动作\n当前状态：" + en.hasTag("naa:no_axolotl_damage"),
        "§atrue", "§cfalse",
        (pl, res) => {
            if (res === null) return;
            res ? en.addTag("naa:no_axolotl_damage") : en.removeTag("naa:no_axolotl_damage");
            pl.tell("功能 noAxolotlDamage 设置为 " + res);
        })
    return false;
});
