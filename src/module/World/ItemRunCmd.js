import * as func from "../../lib/func.js";
const onItemCD = new Set()


mc.listen("onUseItem", (player, item) => {
    const cmdlist = item?.getNbt()?.getTag("tag")?.getData("qys_runcmd")?.toArray()
    if (player.isSneaking || func.isNull(cmdlist) || onItemCD.has(player.xuid)) return
    onItemCD.add(player.xuid)

    cmdlist.forEach(cmd => {
        if (cmd[0] == "/") return func.enRuncmd(player, cmd)
        player.runcmd(`${cmd}`)
    })
    setTimeout(() => onItemCD.delete(player.xuid), 10)
    return false
})

mc.listen("onUseItemOn", (player, item) => {
    const cmdlist = item?.getNbt()?.getTag("tag")?.getData("qys_runcmd")?.toArray()
    if (player.isSneaking || func.isNull(cmdlist) || onItemCD.has(player.xuid)) return
    onItemCD.add(player.xuid)

    cmdlist.forEach(cmd => {
        if (cmd[0] == "/") return func.enRuncmd(player, cmd)
        player.runcmd(`${cmd}`)
    })
    setTimeout(() => onItemCD.delete(player.xuid), 10)
    return false
})


mc.listen("onLeft", (player) => {
    if (onItemCD.has(player.xuid)) onItemCD.delete(player.xuid)
})