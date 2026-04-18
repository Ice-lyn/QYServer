const plAfkData = new Map()
const bossBarId = 100860046

setInterval(() => {
    mc.getOnlinePlayers().forEach((pl) => {
        // if (pl.isMoving) return resetAfk(pl) // 玩家移动
        if (pl.hasTag("qys:in_afk")) return
        const afkTime = (plAfkData.get(pl.xuid) || 0)
        plAfkData.set(pl.xuid, afkTime + 3)
        if (afkTime >= (10 * 60) || pl.hasTag("qys:join_afk")) {
            plAfkData.delete(pl.xuid)
            pl.addTag("qys:in_afk")
            pl.removeTag("qys:join_afk")
            pl.setBossBar(bossBarId, "§b挂机中...", 100, 3)
            mc.runcmdEx(`execute as "${pl.realName}" run scriptevent usf:command name set [§b挂机中...§r]/name`)
        }
    })
}, 3000)

function resetAfk(pl) {
    plAfkData.delete(pl.xuid)
    if (pl.hasTag("qys:in_afk")) {
        pl.removeTag("qys:in_afk")
        pl.removeBossBar(bossBarId)
        mc.runcmdEx(`execute as "${pl.realName}" run scriptevent usf:command name set /name`)
        mc.runcmdEx(`execute as "${pl.realName}" run function action/action_stop`)
    }
}

mc.listen("onLeft", (pl) => plAfkData.delete(pl.xuid)) // 清理离线玩家数据
mc.listen("onUseItem", resetAfk)
mc.listen("onUseItemOn", resetAfk)
mc.listen("onAttackEntity", resetAfk)
mc.listen("onDestroyBlock", resetAfk)
mc.listen("afterPlaceBlock", resetAfk)
mc.listen("onChat", resetAfk)
mc.listen("onSneak", resetAfk)
mc.listen("onJump", resetAfk)