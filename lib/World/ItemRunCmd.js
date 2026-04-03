//const config = require("./QYServer/config/config.js")
const onItemCD = new Set()


mc.listen("onUseItem",(player,item) => {
    const cmdlist = item?.getNbt()?.getTag("tag")?.getData("qys_runcmd")?.toArray()
    if (player.isSneaking || isNull(cmdlist) || onItemCD.has(player.xuid)) return
    onItemCD.add(player.xuid)
  
    cmdlist.forEach(cmd => {
        if (cmd[0] == "/") return mc.runcmdEx(`execute as "${player.realName}" at @s run ${cmd}`)
        player.runcmd(`${cmd}`)
    })
    setTimeout(() => onItemCD.delete(player.xuid),10)
    return false
})

mc.listen("onUseItemOn",(player,item,block,side,pos) => {
    const cmdlist = item?.getNbt()?.getTag("tag")?.getData("qys_runcmd")?.toArray()
    if (player.isSneaking || isNull(cmdlist) || onItemCD.has(player.xuid)) return
    onItemCD.add(player.xuid)
  
    cmdlist.forEach(cmd => {
        if (cmd[0] == "/") return mc.runcmdEx(`execute as "${player.realName}" at @s run ${cmd}`)
        player.runcmd(`${cmd}`)
    })
    setTimeout(() => onItemCD.delete(player.xuid),10)
    return false
})


mc.listen("onLeft", (player) => {
    if (onItemCD.has(player.xuid)) onItemCD.delete(player.xuid)
})

/**
 * 空值检查函数
 * @param {*} enter - 需要检查的输入值
 * @returns {boolean} - 如果值为null或undefined则返回true，否则返回false
 */
function isNull(enter) {
    if (enter == null) return true
    if (enter == undefined) return true
    return false
}

/**
 * 判断是否有权限在领地内操作
 * @param {Player} Player 玩家对象
 * @param {IntPos} Pos 方块的坐标对象
 * @returns {Boolean} - 返回是否有权限
 */
function LandJudgment(Player, Pos) {
    const toRawPos = (Pos) => ({
        'x': Pos.x,
        'y': Pos.y,
        'z': Pos.z,
        'dimid': Pos.dimid
    });
    if (ll.hasExported('ILAPI_PosGetLand')) {// iLand
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
    return true;
}