const afkData = new Map();
const posData = new Map();
const bossBarId = 100860046;

setInterval(() => {
    mc.getOnlinePlayers().forEach((pl) => {
        if (isMoving(pl)) return resetAfk(pl); // 玩家移动
        if (pl.hasTag("qys:in_afk")) return;

        const afkTime = (afkData.get(pl.xuid) || 0);
        afkData.set(pl.xuid, afkTime + 5);
        if (afkTime >= (10 * 60) || pl.hasTag("qys:join_afk")) {
            afkData.delete(pl.xuid);
            pl.addTag("qys:in_afk");
            pl.removeTag("qys:join_afk");
            pl.setBossBar(bossBarId, "§b挂机中...", 100, 3);
            mc.runcmdEx(`execute as "${pl.realName}" run scriptevent usf:command name set [§b挂机中...§r]/name`);
        }
    })
}, 5000)

function isMoving(pl) {
    const pos = pl.pos.x + pl.pos.y + pl.pos.z + pl.pos.dimid + pl.direction.pitch + pl.direction.yaw;
    if (posData.get(pl.xuid) !== pos) {
        posData.set(pl.xuid, pos);
        return true;
    }
    return false;
}

function resetAfk(pl) {
    afkData.delete(pl.xuid);
    if (pl.hasTag("qys:in_afk")) {
        pl.removeTag("qys:in_afk");
        pl.removeBossBar(bossBarId);
        mc.runcmdEx(`execute as "${pl.realName}" run scriptevent usf:command name set /name`);
        mc.runcmdEx(`execute as "${pl.realName}" run function action/action_stop`);
    }
}

mc.listen("onLeft", (pl) => {
    afkData.delete(pl.xuid);
    posData.delete(pl.xuid);
});

mc.listen("onUseItem", resetAfk);
mc.listen("onUseItemOn", resetAfk);
mc.listen("onAttackEntity", resetAfk);
mc.listen("onDestroyBlock", resetAfk);
mc.listen("afterPlaceBlock", resetAfk);
mc.listen("onChat", resetAfk);
mc.listen("onSneak", resetAfk);
mc.listen("onJump", resetAfk);