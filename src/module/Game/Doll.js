const rotMap = [
    [0, -1], [1, -1], [1, 0], [1, 1],
    [0, 1], [-1, 1], [-1, 0], [-1, -1]
]
const dollEffectMap = {
    1: "吹飞抚摸他的玩家, 可用来跑图?",
    2: "聆听我家鸽鸽精美的声音∽",
    5: "便携式信标, 50格内提供急迫三",
    29: "自动攻击附近怪物, 支持抢夺附魔"
}

mc.listen("onUseItemOn", (pl, item, block, side, pos) => {
    if (pl.isSneaking || !block.type.includes("qys:doll")) return
    const upBlock = mc.getBlock(pos.x, pos.y, pos.z, pos.dimid)

    // 商店购买
    if (upBlock.type.includes("minecraft:light_block")) {
        let money = upBlock.type.split("_")[2]
        money = money * (money[0] == "1" ? 2500 : 1000)
        if (money == 0) return
        pl.sendModalForm("兑换",
            `要兑换此玩偶吗?\n这将消耗§b ${money} §r蜡烛!\n玩偶特殊效果: §a${dollEffectMap[Number(block.type.split("_")[1])] || "§r无"}`,
            "§a确定", "§c补药",
            (pl, res) => {
                if (!res) return // 可以同时判断null和不要
                if (pl.getScore("蜡烛") < money) return pl.tell("你还没有这么多蜡烛呢>_<", 5)
                pl.reduceScore("蜡烛", money) && pl.giveItem(mc.newItem(`${block.type}`, 1))
                mc.runcmdEx(`execute as "${pl.realName}" at @s run playsound random.orb @s`)
            })
    } else dollEffect(pl, block)
})

const toCmdPos = ({ x, y, z }) => `${x} ${y} ${z}`

function dollEffect(pl, block) {
    const type = Number(block.type.split("_")[1])
    const rot = rotMap[block.getBlockState()["qys:rotation"]]

    // pl.tell(`type:${type}, rot:${rot}`)
    switch (type) {
        case 1: // null玩偶 - 效果吹飞
            mc.runcmdEx(`execute as "${pl.realName}" run scriptevent usf:command knock ${rot[0] * 10} ${rot[1] * 10} 0.85`)
            return
        case 2: // 坤坤玩偶 - 效果播放音乐
            mc.runcmdEx(`execute at "${pl.realName}" positioned ${toCmdPos(block.pos)} run playsound custom.ikun_sound @a[r=10]`)
            return
        /*case 3:
          return
        case 4:
        case 8: // him玩偶 - 
        case 9:
        case 17:
          return*/
    }
}