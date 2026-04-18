mc.listen("onScoreChanged", (player, num, name) => {
    if (!player
        || name !== "onPluginEvent"
        || num <= 1 // 如果不为零就处理
    ) return
    player.setScore("onPluginEvent", 0) // 这里的设置为零还会再触发一次事件, 所以要在前面的判断上加(num <= 1)

    player.getAllTags()
        .filter(tag => tag.startsWith("qys:onEvent_"))
        .forEach(tag => {
            player.removeTag("qys:onEvent_" + tag)
            switch (tag.replace("qys:onEvent_", "")) {
                case "gm1":// 假创造
                    const packet = new BinaryStream()
                    packet.writeVarInt(1)
                    player.sendPacket(packet.createPacket(62))
                    break
                case "b":
                    player.tell("aaabbc")
                    break
            }
        })
})



