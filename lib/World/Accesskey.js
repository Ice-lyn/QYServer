const Accesskey = new JsonConfigFile("./plugins/QYServer/Data/System/Accesskey.json", "{}")
const ing_validateList = new Set()

mc.listen("onUseItem",(pl)=>{if (ing_validateList.has(pl.xuid)) return false})
mc.listen("onUseItemOn",(pl)=>{if (ing_validateList.has(pl.xuid)) return false})
mc.listen("onStartDestroyBlock",(pl)=>{if (ing_validateList.has(pl.xuid)) return false})
mc.listen("onPlaceBlock",(pl)=>{if (ing_validateList.has(pl.xuid)) return false})
mc.listen("onPlayerInteractEntity",(pl)=>{if (ing_validateList.has(pl.xuid)) return false})
mc.listen("onAttackEntity",(pl)=>{if (ing_validateList.has(pl.xuid)) return false})
mc.listen("onOpenContainerScreen",(pl)=>{if (ing_validateList.has(pl.xuid)) return false})

mc.listen("onJoin", (pl) => {
    if (!pl || !pl.inWorld) return
    if (Accesskey.get(pl.xuid) !== null) validateKey(pl)
})

// 玩家执行命令
mc.listen("onPlayerCmd", (player, cmd) => {
    const args = cmd.split(" ")
    if (args[0] === "debug" && player.isOP()) {
        if (args[1] == 1) validateKey(player)
        if (args[1] == 2) setAccessKey(player)
        if (args[1] === "true") ingValidate(player,true)
        if (args[1] === "false") ingValidate(player,false)
        return false
    }
    if (args[0] === "ll") return
    if (ing_validateList.has(player.xuid)) return false
})

function ingValidate(pl,mode) {// true: 验证通过 || false: 开始验证
    const modeList = [
        "camera",
        "movement",
        "sneak",
        "jump",
        "mount",
        "dismount"
    ]
    if (!mode) ing_validateList.delete(pl.xuid)
    else if (!ing_validateList.has(pl.xuid)) ing_validateList.add(pl.xuid)
  
    mc.runcmdEx(`ability "${pl.realName}" mute ${mode}`)
    modeList.forEach(i => {
        mc.runcmdEx(`inputpermission set "${pl.realName}" ${i} ${mode ? "disabled" : "enabled"}`)
    })
}

function setAccessKey(pl) {
    if (ing_validateList.has(pl.xuid)) return
    const fm = mc.newCustomForm()
        .setTitle("设置密码")
        .addLabel("为了您的账号安全考虑，建议设置加入密码\n§a启用后，您每次登录将会验证密码\n§b(设为空密码则下次不验证)")
        .addInput("新的加入密码:", "请输入密码")
    pl.sendForm(fm, (pl, data) => {
        if (data === null) return
        const password = data[1]?.trim()
        if (password && password.length > 0) {
            Accesskey.set(pl.xuid, password)
            pl.tell("§a密码设置成功!")
        } else if (Accesskey.get(pl.xuid)) {
            Accesskey.delete(pl.xuid)
            pl.tell("§a成功清除密码! 下次加入时将不会验证")
        }
    })
}

function validateKey(pl) {
    if (Accesskey.get(pl.xuid) == null) return
    ingValidate(pl,true)
    const fm = mc.newCustomForm()
        .setTitle("密码验证")
        .addLabel("为保障您的账户安全，本次登录需输入密码")
        .addInput("输入密码:", "在这里输入您的密码")
    pl.sendForm(fm, (pl, data) => {
        if (data == null) return validateKey(pl)
        if (data[1] == Accesskey.get(pl.xuid)) {
            pl.tell("§a✓ 验证通过!")
            ingValidate(pl,false)
        } else {
            pl.tell("§c✗ 密码错误!")
            validateKey(pl)
        }
    })
}
