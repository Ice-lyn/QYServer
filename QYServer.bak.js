ll.registerPlugin("QYServer","QY服务器专用插件",[1,0,0],{"author":"fangfubin0782"})

const { Minecraft, Recipes } = require('./GMLIB-LegacyRemoteCallApi/lib/GMLIB_API-JS')
const { PAPI } = require('./GMLIB-LegacyRemoteCallApi/lib/BEPlaceholderAPI-JS')
const il = require("./iListenAttentively-LseExport/lib/iListenAttentively.js")
const config = require("./QYServer/config/config.js")
logger.setTitle("Server")

// 硬编码配置文件
const in_maintain = false // 维护模式

// 初始化变量
const getdataTemporaryData = new Map()
const debugMode = false
let pngMap = null
let in_backup = false
let setMinecartSpeedCD = false
const UpdateWeatherType = { // 数据包type
    StartRaining: 3001,  // 开始下雨
    StartThunderstorm: 3002,  // 开始雷暴
    StopRaining: 3003,  // 停止下雨
    StopThunderstorm: 3004  // 停止雷暴
}

PAPI.registerPlayerPlaceholder(getChatTag,"QYServer","player_chatTag")// 注册PAPI
il.emplaceListener("lac::punish::PlayerBanWaveEvent",(i) => mc.broadcast(`[§eTip§r] ${i.self.toPlayer().realName} 被反作弊娘吃掉了 (｡･ω･｡)`))// 监听反作弊提出
il.emplaceListener("lac::punish::PlayerCheatEvent",(i) => i.self.toPlayer().tell("lac::punish::PlayerCheatEvent"))// 监听反作弊提出
mc.listen("onEndermanTakeBlock",()=>{return false}) // 防搬方块
mc.listen("onWitherBossDestroy",()=>{return false}) // 凋零防爆
mc.listen("onRespawnAnchorExplode",(pos,pl) => {// 重生毛爆炸
  if (pos.dimid == 0){ 
    pl.tell("不要在主世界使用重生猫啊喂！")
    return false
  }
})

// 服务器启动后事件
mc.listen("onServerStarted",() => {
    Buddha() // 佛祖保佑
    Recipes.unregisterRecipe("minecraft:bundle")// 注销收纳袋合成表
    setTimeout(() => mc.runcmd("reload"),3000) // 修复函数包不加载
})

// 玩家连接世界
mc.listen("onPreJoin",(pl) => {
    //if (pl.getDevice().serverAddress == "qymc.fucku.top:41657" && pl.hasTag("player")) return
    mc.runcmdEx("playsound custom.online_sound @a")
    logger.info(`玩家 ${pl.realName} 连接中，版本：${PAPI.getValueByPlayer("player_client_version",pl)} (${PAPI.getValueByPlayer("player_protocol_version",pl)})`)
})

// 玩家加入事件
mc.listen("onJoin",(player) => {
    if (!player || !player.inWorld) return
    if (in_maintain && !player.isOP()) return player.kick("停服维护中...")
    if (config.banName.has(player.realName) || config.banXuid.has(player.xuid)) return crash(player) || player.kick("服务器发送了的破损数据包")
    //if (player.getDevice().serverAddress == "qymc.fucku.top:41657" && player.hasTag("player")) return joinSkip(player)
    if (!player.hasTag("player")) newPlayerUi(player)
    if (!debugMode) mc.runcmdEx(`execute as "${player.realName}" at @s run function function/Server/player_initializ`)
})

// 后台执行命令
mc.listen("onConsoleCmd",(cmd) => {
    if (cmd == "") return false
    const args = cmd.split(" ")
  
    switch (cmd) {
      case "testfor":
        mc.getOnlinePlayers().forEach(pl=>log(`${pl.realName} -> ${mc.runcmdEx("execute as \""+pl.realName+"\" at @s run testfor @e[r=160]").output?.split(", ")?.length}`))
        return false
      case "tps":
        logger.info(mc.runcmdEx("cleaner tps").output)
        return false
      case "mspt":
        logger.info(mc.runcmdEx("cleaner mspt").output)
        return false
    }
  
    switch (args[0]) {
      case "say":
        ll.imports("BehaviorLog_WriteLog")("后台喊话","Server","服务器娘","","","","","","","",`${cmd}`,false,true)
        return
      case "aichat":
        aiChatServer(cmd.replace(/^aichat\s+/, ""))
        return false
    }
})

// 玩家发送聊天信息
mc.listen("onChat", (player, msg) => {
    const dim = {0: "§b主世界§r", 1: "§c下界§r", 2: "§d末地§r"}[player.pos.dimid] || "§9未知§r"
    const tag = getChatTag(player)
    const ms = player.getDevice()?.avgPing > 100 ? `[§c${player.getDevice().avgPing}§rms§r]` : ""
    logger.setTitle("Chat")
    logger.info(`<${player.realName}> ${msg}`)
    logger.setTitle("Server")
    msg = textToEmoji(msg)
    if (msg[0] == "+") return
    mc.broadcast(`[${tag}][${dim}]${ms}${player.realName} >> ${msg}`,1)
    if (["ai","服务","妈","操"].some(i => msg.includes(i))) aiChatServer(textToEmoji(msg,1),player.realName)
    switch (true) {
        case msg.toLowerCase().includes("ciallo"):
            mc.runcmdEx("execute as @a at @s run playsound custom.ciallo_sound @s");
            break;
        case msg.includes("你干嘛"):
            mc.runcmdEx("execute as @a at @s run playsound custom.ikun_sound @s");
            break;
        case player.hasTag("isCat"):
            mc.runcmdEx("execute as @a at @s run playsound mob.cat.meow @s");
            break;
        case msg.includes("死"):
            aiChatServer(textToEmoji(msg,1))
            player.tell("§l你不孤单，我们都在！！")
            player.tell(">> 如果需要帮助，请拨打全国24小时免费心理咨询热线")
            player.tell(">> 010-82951332")
        default:
            mc.runcmdEx("execute as @a at @s run playsound custom.called_sound @s");
            mc.runcmdEx(`execute as "${player.realName}" at @s anchored eyes run particle qys:sky_called ~~0.2~`)
            break
    }
    return
})

// 玩家执行命令
mc.listen("onPlayerCmd", (player, cmd) => {
    logger.setTitle("Command");
    logger.info(`<${player.realName}> /${cmd}`);
    logger.setTitle("Server");
    switch(cmd) {
        case "msg":
            msgUI(player)
            return false
        case "testfor":
            player.tell("==============")
            player.tell(`所有实体数: ${mc.runcmdEx("testfor @e").output.split(", ").length}`)
            player.tell("玩家160格附近实体数：")
            mc.getOnlinePlayers().forEach(pl=>player.tell(`${pl.realName} -> ${mc.runcmdEx("execute as \""+pl.realName+"\" at @s run testfor @e[r=160]").output?.split(", ")?.length}`))
            player.tell("==============")
            return false
    }
    switch (cmd.split(" ")[0]) {
        case "me":
            player.tell(playerInfo(player))
            return false
        case "fc":
            return player.tell("[§aTip§r] 再次输入\"/fc\"开关自由视角")
        case "prof":
            return mc.broadcast("开始性能测试...")
        case "rotate":
            if (!isNull(player.getBlockFromViewVector(false)?.pos) && !LandJudgment(player,player.getBlockFromViewVector(false)?.pos)) {
                player.tell("这里是领地，你无权操作",4)
                return false
            }
            return
        case "r":
            if (!isNull(player.getBlockFromViewVector(false)?.pos) && !LandJudgment(player,player.getBlockFromViewVector(false)?.pos)) {
                player.tell("这里是领地，你无权操作",4)
                return false
            }
            return
    }
    return devfunc(player,cmd)
})

// 实体受伤
mc.listen("onMobHurt",(mob,source,damage,cause) => {
    if (mob.type == "minecraft:player") {
        if (source?.type == "minecraft:ender_dragon" 
          && cause == ActorDamageCause.EntityAttack 
          && mob.hasTag("qys:ride_ender_dragon")
        ) return false
    }
})

// 玩家攻击生物
mc.listen("onAttackEntity",(pl,en) => {
    if (pl.getHand()?.getNbt()?.getTag("tag")?.getData("is32k")){
        if (en.type == "minecraft:player") return false
        if (!pl.hasTag("op")) {pl.getHand()?.setNull();return false}
    }
    if (en.type == "qys:message") {
        const messageName = en.name.split('\n').pop()
        if (messageName.includes(`${pl.realName}§n§a§m§e§校§验`) || messageName.includes(`匿名\n§k${pl.realName}§n§a§m§e§校§验`))
          pl.sendModalForm("留言纸船","是否删除这条留言？这将无法恢复！","§c立刻删除§r","§a我再想想§r",(player,ui) => {
            if (!ui) return
            return en.despawn()
        });
        else if (pl.isOP()) pl.sendModalForm("留言纸船","[OP管理] 是否删除？","§c立刻删除§r","§a我再想想§r",(player,ui) => {
            if (!ui) return
            return en.despawn()
        })
    }
})

// 漏斗传输物品
mc.listen("onHopperPushOut",(pos,isMinecart,item) => {
    if (isMinecart) return
    if (item.type.includes("bundle")) return false
})

// 玩家尝试放置方块
mc.listen("onPlaceBlock",(pl,bl,face) => {
    if ((config.banBlock.has(bl.type) && !pl.isOP()) || bl.type.includes("minecraft:element_")) {
        pl.tell("§c您需要创造模式 + 操作员权限来放置此方块§r")
        //pl.refreshChunks()
        return false
    }
})

// 玩家对方块使用物品
mc.listen("onUseItemOn",(pl,item,block) => {
    if (item.type.match("spawn_egg") && pl.gameMode != 1) {
        if (block.type == "minecraft:trial_spawner") return false
        if (block.type == "minecraft:mob_spawner") return false
    }
})

// 玩家使用物品
mc.listen("onUseItem",(pl,item) => {
    if (item.type == "qys:wing") {
        if (pl.maxHealth == 30) return pl.tell("[§aTip§r] 您的光翼已达上限(" + pl.maxHealth + "/30)")
        pl.setMaxHealth(pl.maxHealth + 1)
        mc.runcmdEx(`execute as "${pl.realName}" at @s run playsound random.orb @s`)
        return pl.clearItem("qys:wing",1)
    }
    if (pl.isSneaking && !pl.getHand()?.isNull()) return xpFix(pl)
})


// 玩家跳跃
mc.listen("onJump", (pl) => {
    const block = pl.getBlockStandingOn()
    if (block?.type == config.sky_block_type) {
        const targetY = findUpBlock(pl.blockPos)
        if (!targetY) return pl.tell("楼上没有云朵啦>_<",5)
        pl.teleport(new FloatPos(pl.pos.x, targetY + 0.1, pl.pos.z, pl.pos.dimid)) && pl.tell("§a叮咚~上楼!",5)
    }
});

// 玩家潜行
mc.listen("onSneak", (pl, isSneaking) => {   
    if (!isSneaking) return
    const block = pl.getBlockStandingOn()
    if (block?.type == config.sky_block_type) {
        const targetY = findDownBlock(pl.blockPos)
        if (!targetY) return pl.tell("楼下没有云朵啦>_<",5)
        pl.teleport(new FloatPos(pl.pos.x, targetY + 0.1, pl.pos.z, pl.pos.dimid)) && pl.tell("§a叮咚~下楼!",5)
    }
});


// 生物死亡事件
mc.listen("onMobDie", (mob,source) => {
    if (!mob || !source) return
    if (source.type !== "minecraft:player") return
    mc.runcmdEx(`execute as "${source.toPlayer().realName}" run function function/killEntity`)
    if (source.hasTag("每日任务_进行中") && !source.hasTag("每日任务_2")) {
        mc.runcmdEx(`playsound custom.taskAdd_sound "${source.toPlayer().realName}"`)
        mc.runcmdEx(`scoreboard players add "${source.toPlayer().realName}" 每日任务_击杀 1`)
    }
})

// 玩家死亡事件
mc.listen("onPlayerDie", (pl) => {
    if (pl.maxHealth > 20) {
        pl.setMaxHealth(pl.maxHealth - 1); // 扣一颗心
        mc.runcmdEx(`playsound custom.Injured_sound "${pl.realName}"`);
    } else {
        pl.setMaxHealth(20); // 心小于20时设置成20
    }
});

// 生物骑乘
mc.listen("onRide",(rider,mount) => {
    if (rider.type == "qys:message") return false
    if (mount.type == "minecraft:ender_dragon" && !rider.hasTag("qys:ride_ender_dragon")) return false
})

// 玩家重生事件
mc.listen("onRespawn", (pl) => {
    const skinEffectId = pl.getAllTags().find(t => t.startsWith('qys:beforeSkin_'))?.split('_')[1] || null
    if (skinEffectId) {
        setTimeout(()=>{
            pl.addEffect(14, 9999999, 1, false);
            setSkinEffect(pl, skinEffectId, 1)
        },700)
    }
})

// 玩家移除效果事件
mc.listen("onRespawn",(pl) => {
    const beforeSkin = pl.getAllTags().find(t => t.startsWith('qys:beforeSkin_'))?.split('_')[1] || null
    if (beforeSkin) return setSkinEffect(pl,beforeSkin,1)
})

// 皮肤装备相关
mc.listen("onSetArmor", (pl, slotNum, item) => {
    if (!pl || !pl.inWorld) return
    if (slotNum !== 0) return
  
    const isSkinItem = item?.type?.startsWith("qys:skin_item_");
    const skinNum = item?.type?.match(/skin_item_(\d+)/)?.[1];
    const beforeSkin = pl.getAllTags().find(t => t.startsWith('qys:beforeSkin_'))?.split('_')[1] || null
  
    // 脱下皮肤
    if (!isSkinItem) {
        if (!beforeSkin) return

        pl.removeEffect(14)
        setSkinEffect(pl, beforeSkin, 0)
        pl.removeTag("isCat")
        if (beforeSkin == 8) mc.runcmdEx(`playanimation "${pl.realName}" animation.player.qys_recover none 0 "" horror`)
        if (beforeSkin == 7) mc.runcmdEx(`playanimation "${pl.realName}" animation.player.qys_recover none 0 "" riru`)
        if (beforeSkin == 5 && !pl.isCreative) mc.runcmdEx(`ability "${pl.realName}" mayfly false`)
      
        pl.removeTag("qys:beforeSkin_" + beforeSkin)
        pl.removeTag("qys:beforeSkin_" + skinNum)
        return;
    }
    // 穿上新皮肤
    if (beforeSkin) setSkinEffect(pl, beforeSkin, 0);
    setSkinEffect(pl, skinNum, 1);
    pl.addEffect(14, 9999999, 1, false);
    // 特殊皮肤处理
    if (skinNum == 8) mc.runcmdEx(`playanimation "${pl.realName}" animation.player.qys_horror none 1 "" horror`)
    if (skinNum == 7) mc.runcmdEx(`playanimation "${pl.realName}" animation.player.qys_riru none 1 "" riru`)
    if (skinNum == 3) pl.addTag("isCat");
    if (skinNum == 5) mc.runcmdEx(`ability "${pl.realName}" mayfly true`);

    pl.removeTag("qys:beforeSkin_" + beforeSkin)
    pl.removeTag("qys:beforeSkin_" + skinNum)
    pl.addTag("qys:beforeSkin_" + skinNum)
})

// ** 循环计时器区 ** //

// 清除临时存储数据
setInterval(() => getdataTemporaryData.clear,120000)

// 玩家延迟显示
setInterval(() => {
    mc.getOnlinePlayers().forEach(pl => {
        const ms = mc.getScoreObjective("ms")
        const ping = pl.getDevice()?.avgPing ?? 255
        if (ms.getScore(pl) !== ping) ms.setScore(pl, ping)
    })
},2 * 1000)

// 光环耐久扣除
setInterval(() => {
    mc.getOnlinePlayers().forEach((pl) => {
        const item = pl.getArmor().getItem(0)
        if (!item.isNull() 
            && (item.type.startsWith("qys:hoshino_") || item.type.startsWith("qys:shiroko_")) 
            && !pl.hasTag("tag:§r§l§d爱心§e捐§a助§b者§r")
            && !pl.isOP()
        ) return
        item.setDamage(Math.max(0, item.damage + 1))
    })
},60 * 1000)

// 一言
setInterval(() => {
    const text = config.wordList[Math.floor(Math.random() * config.wordList.length)]
    mc.getOnlinePlayers().forEach((pl) => {
        if (!pl.hasTag("qys:no_word")) pl.tell(`${text}`,5)
    })
},config.wordtime * 60 * 1000)

// 客户端天气显示修复
setInterval(() => {
    if (mc.getWeather() === 0) {  // 晴天
        sendUpdateWeatherPacket(UpdateWeatherType.StopThunderstorm);
        sendUpdateWeatherPacket(UpdateWeatherType.StopRaining);
    }
    if (mc.getWeather() === 1) sendUpdateWeatherPacket(UpdateWeatherType.StartRaining) // 下雨
    if (mc.getWeather() === 2) sendUpdateWeatherPacket(UpdateWeatherType.StartThunderstorm) // 雷暴
},30000)

/***** 命令注册区 *****/

// sinfo - 查询服务器运行状态
mc.listen('onServerStarted', ()=> {
    const cmd = mc.newCommand('sinfo', '§a查询服务器运行状态' ,PermType.Any)
    cmd.setCallback((_cmd, ori, out, _res) => {
        const info = [
          "============ 服务器运行状态 ============",
          `当前时间: ${system.getTimeStr()}`,
          "TPS: %server_tps_colored%",
          "MSPT: %server_mspt_colored%",
          "服务器版本: %server_version%(%server_protocol_version%)",
          "BDS使用内存: %server_ram_bds_used%",
          "已使用内存: %server_ram_used%",
          "最大内存: %server_ram_max%",
          "空闲内存: %server_ram_free%",
          "在线玩家: %server_online%/%server_max_players%",
          "运行时间: %server_uptime%s",
          "实体总数: %server_total_entities%",
          "系统名称: %system_name%",
          "系统版本: %system_version%",
          "系统区域代码: %system_locale_code%",
          "LeviLamina版本: %levilamina_version%",
          "============= 数据文件相关 =============",
          `数据库玩家数：${data.getAllPlayerInfo().length} 人`,
          `已加载插件数：${ll.listPlugins().length} 个`,
          `领地数据文件大小：${getFileSize(File.getFileSize("./plugins/iland/data.json"))}`,
          `成就数据文件大小：${getFileSize(File.getFileSize("./plugins/Achievement/Data.json"))}`,
          `当日日志文件大小：${getFileSize(File.getFileSize(`./logs/BehaviorLog/BehaviorLog-${system.getTimeStr().split(" ")[0]}.csv`))}`,
          `日志记录文件总数：${File.getFilesList("./logs/BehaviorLog/").length}`,
          "======================================"
        ]
        info.forEach(i => out.success(PAPI.translateString(i)))
    })
    cmd.overload([])
    cmd.setup()
})

// msgui - 快捷私聊菜单
mc.listen('onServerStarted', ()=> {
    const cmd = mc.newCommand('msgui', '§a快捷私聊菜单' ,PermType.Any)
    cmd.setCallback((_cmd, ori, out, _res) => {
        if (!ori.player) return out.error("私聊坏掉了，这绝对不是猫猫的错，绝对不是>_<")
        return msgUI(ori.player)
    })
    cmd.overload([])
    cmd.setup()
})

// chattag - 设置聊天称号
mc.listen('onServerStarted', ()=> {
    const cmd = mc.newCommand('chattag', '§e设置聊天称号' ,PermType.Any)
    cmd.setCallback((_cmd, ori, out, _res) => {
        if (!ori.player) return out.error("设置坏掉了，这绝对不是猫猫的错，绝对不是>_<")
        if (ori.player.hasTag("qys.tag:unset")) return pl.tell("[§e称号系统§r] >> §c当前称号无法更改")
        const tagList = ori.player.getAllTags().filter(item => item.startsWith("tag:"));//tagList.unshift("tag:§e萌§a新§b求§d带§r");
        if (tagList.length == 0) return ori.player.tell("[§e称号系统§r] >> 未找到可佩戴的称号")
        const fm = mc.newCustomForm().setTitle("称号设置").addDropdown("选择一个要佩戴的称号\n已佩戴称号: " + getChatTag(ori.player), tagList);
        ori.player.sendForm(fm, (pl, data) => {
            if (isNull(data)) return
            mc.runcmdEx(`tag "${pl.realName}" add "usf.${tagList[data]}"`)
            pl.tell("[§e称号系统§r] >> §a佩戴成功, 已佩戴称号§r: " + tagList[data].replace(/^tag:/, ""))
            mc.runcmdEx(`execute as "${pl.realName}" at @s run playsound random.levelup @s ~~~ 10 2`)
        });
    })
    cmd.overload([])
    cmd.setup()
})

// offhand - 主副手切换
mc.listen('onServerStarted', ()=> {
    const HAND = mc.newCommand('offhand', '§a主副手切换' ,PermType.Any)
    HAND.setCallback((_cmd, ori, out, _res) => {
        if (!ori.player) return out.error("我缺的玩家对象这一块谁来给我补啊")
        if (ori.player.getHand()?.getNbt()?.getTag("tag")?.getData("PickUp")) return out.error("请放下搬运物再使用吧")
        let itemBak = ori.player.getHand().clone()
        ori.player.getHand().set(ori.player.getOffHand())
        ori.player.getOffHand().set(itemBak)
        ori.player.refreshItems()
        return ori.player.tell(`§a已交换手部物品`)
    })
    HAND.overload([])
    HAND.setup()
})

// helmet - 头部盔甲互换
mc.listen('onServerStarted', ()=> {
    const cmd = mc.newCommand('helmet', '§a头部盔甲切换' ,PermType.Any)
    cmd.setCallback((_cmd, ori, out, _res) => {
        if (!ori.player) return out.error("我缺的玩家对象这一块谁来给我补啊")
        if (ori.player.getHand()?.getNbt()?.getTag("tag")?.getData("PickUp")) return out.error("请放下搬运物再使用吧")
        let itemBak = ori.player.getHand().clone()
        ori.player.getHand().set(ori.player.getArmor().getItem(0))
        ori.player.getArmor().getItem(0).set(itemBak)
        ori.player.refreshItems()
        return ori.player.tell(`§a已交换头盔与主手物品`)
    })
    cmd.overload([])
    cmd.setup()
})

// scale - 自定义大小
mc.listen("onServerStarted", ()=> {
    const cmd = mc.newCommand("scale", "§b自定义大小", PermType.Any)
    cmd.optional('Int', ParamType.Int, 1)
    cmd.overload(['Int'])
    cmd.setCallback((_cmd, ori, out, res) => {
        const player = ori.player
        if (!player) return out.error('此命令仅玩家可使用!')
        if (isNull(res.Int)) {
            player.setScale(1)
            return out.success("大小已恢复为默认值")
        }
        if (res.Int > 35) return out.success("最大不能超过35!")
        if (res.Int < -2) return out.success("最小不能低于-2!")
        player.setScale(res.Int)
        out.success(`大小已修改为${res.Int}倍！`)
        
    });
    cmd.setup();
})


// issues - 反馈问题
mc.listen("onServerStarted", ()=> {
    const cmd = mc.newCommand("issues","§b反馈问题",PermType.Any)
    cmd.optional('text', ParamType.RawText)
    cmd.setCallback((_cmd, ori, out, res) => {
        if (res.text) {
            const data = `${ori.player ? ori.player.realName : ori.name} >> ${res.text}`
            logger.warn(delStringCode(`[反馈] ${data}`))
            File.writeLine("./plugins/QYServer/Data/issues.txt",`[${system.getTimeStr()}] ${data}`)
            return out.success("反馈已提交！")
        }
        if (!ori.player) return out.error("控制台请带参数使用")
        const fm = mc.newCustomForm().setTitle("反馈UI").addInput("反馈内容")
        ori.player.sendForm(fm, (pl, data) => {
            if (!data) return
            logger.warn(delStringCode(`[反馈] ${pl.realName} >> ${data}`))
            File.writeLine("./plugins/QYServer/Data/issues.txt",`[${system.getTimeStr()}] ${pl.realName} >> ${data}`)
            pl.tell("§a反馈已提交！")
        })
    })
    cmd.overload(['text'])
    cmd.setup()
})

// nodeui - 线路节点选择
mc.listen("onServerStarted", () => {
    const nodeuiCmd = mc.newCommand("nodeui", "§b线路节点选择", PermType.Any)
    nodeuiCmd.setAlias("server")
    nodeuiCmd.setCallback((_cmd, pla, out, _res) => {
        if (!pla.player) return out.success("过不去，怎么样都过不去>_<")
        const pl = pla.player
        const ui = "textures/ui/World";
        pl.sendSimpleForm("切换高速节点", "快来选择一个适合你的节点吧∽", ["宁波4电信","江苏三线"], [ui, ui], (pl, id) => {
            switch (id) {
              case 0: // 宁波4电信
                    if (pl.getDevice().serverAddress === "xxx.xxx.xxx.xxx:41657") return pl.tell("你目前正在使用宁波4哦∽")
                    pl.transServer("xxx.xxx.xxx.xxx", 41657) || pl.tell("过不去! 怎么样都过不去!>_<")
                    break;
              case 1: // 江苏三线
                    if (pl.getDevice().serverAddress === "xxx.xxx.xxx.xxx:41657") return pl.tell("你目前正在使用江苏地址哦∽")
                    pl.transServer("xxx.xxx.xxx.xxx", 41657) || pl.tell("过不去! 怎么样都过不去!>_<")
                    break;
            }
        })
    })
    nodeuiCmd.overload([])
    nodeuiCmd.setup()
})

// tpserver - 传送到其他服
mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand("tpserver", "§b前往其他类型服", PermType.Any)
    cmd.setAlias("qyserver")
    cmd.setCallback((_cmd, pla, out, _res) => {
        if (!pla.player) return out.success("过不去，怎么样都过不去>_<")
        const player = pla.player
        const ui = "textures/ui/World"
        const uitext = ["§a测试服","§c空岛服", "§6后室服", "§9创造服"]
        player.sendSimpleForm("前往其他服", "生存玩腻了? 快来其他服玩玩吧∽", uitext, [ui,ui,ui,ui], (pl, id) => {
            if (isNull(id)) return
            switch (id) {
              case 0: // 测试服
                    pl.transServer("xxx.xxx.xxx.xxx",34684)
                    break;
              case 1: // 空岛
                    pl.transServer("hjytuudur.wofrp.net",45636)
                    break;
              case 2: // 后世
                    pl.transServer("hjytuudur.wofrp.net",53563)
                    break;
              case 3: // 创造
                    pl.transServer("xxx.xxx.xxx.xxx",33221)
                    break;
            }
            mc.broadcast(`[§dTPServer§r] >> ${pl.realName} 前往了${uitext[id]}`)
            logger.setTitle("TPServer")
            logger.info(`${pl.realName} 前往了${delStringCode(uitext[id])}`)
            logger.setTitle("Server")
        })
    })
    cmd.overload([])
    cmd.setup()
})

// devfunc - 开发中功能
mc.listen("onServerStarted", ()=> {
    const cmd = mc.newCommand("devfunc","开发中功能",PermType.Any)
    cmd.mandatory('text', ParamType.RawText)
    cmd.overload(["text"])
    cmd.setCallback((_cmd, ori, out, res) => {
        if (!ori.player) return out.error("玩家对象不存在")
        if (devfunc(ori.player,res.text)) out.error("命令对象未注册或没有执行权限")
    })
    cmd.setup()
})


// **** 高权限命令注册 **** //

mc.listen("onServerStarted", ()=> {
    const loggerCmd = mc.newCommand("logger","向控制台输出一段日志 | 适配SAPI/COMM",PermType.GameMasters)
    loggerCmd.mandatory('text', ParamType.RawText)
    loggerCmd.mandatory('mode', ParamType.Int)
    loggerCmd.overload(["mode","text"])
    loggerCmd.setCallback((_cmd, ori, out, res) => {
        let text = res.text
        let mode = res.mode
        logger.setTitle("CmdLog")
        if (mode == 0) logger.info(text)
        if (mode == 1) logger.warn(text)
        if (mode == 2) logger.error(text)
        if (mode == 3) logger.debug(text)
        logger.setTitle("Server")
        out.success("向控制台发送信息 >> " + text)
    })
    loggerCmd.setup()
})

mc.listen("onServerStarted", ()=> {
    const cmd = mc.newCommand("saydata","脚本间数据通信",PermType.GameMasters)
    cmd.mandatory('key', ParamType.String)
    cmd.mandatory('data', ParamType.RawText)
    cmd.mandatory('mode', ParamType.Int)
    cmd.overload(["key","mode","data"])
    cmd.setCallback((_cmd, ori, out, res) => {
        if (res.key !== "saydata-0000-114514") return out.error("验证密钥错误")
        if (ori.type !== 14 && ori.type !== 7) logger.warn(`发现未知通信对象 <Type：${ori.type}|Name：${ori.name}>`)
        const data = res.data
        const mode = res.mode
      
        try {
            if (mode == 1) out.success(`${ll.eval(data)}`)
            if (mode == 2) File.writeTo("./getdata.txt",`${data}`)
            if (mode == 3) colorLog("cyan",data)
            if (mode == 4) getdataTemporaryData.set(`${data.split(" ")[0]}`,`${data.split(" ").slice(1).join(" ")}`)
            if (mode == 5) {out.success(`${getdataTemporaryData.get(`${data}`)}`);getdataTemporaryData.delete(`${data}`)}
        } catch (error) {
          logger.error(`脚本间通讯传输失败！模式：${{1:"运行JS字符串",2:"写入临时文件",3:"打印日志",4:"设置临时数据",5:"获取临时数据"}[mode] || mode} | ${error}`)
        }

    })
    cmd.setup()
})

mc.listen('onServerStarted', ()=> {
    const cmd = mc.newCommand("opserver", "管理服务器相关设置项" ,PermType.GameMasters)
    cmd.setCallback((_cmd, ori, out, _res) => {
        if (!ori.player) return out.error("不要在控制台执行啊喂！")
        if (!ori.player.isOP()) return out.error("打不开！怎么按也打不开！>_<")
        const pl = ori.player
        const fm = mc.newSimpleForm()
          .setTitle("OP管理菜单")
          .setContent("选择一个要管理的项吧∽")
          .addButton("设置聊天称号","textures/items/cake")
          .addButton("崩溃玩家客户端","textures/NotUsed/hajimi")
          .addButton("开始存档备份","textures/ui/World")
          .addButton("数据包隐身","textures/ui/lock_color")
          .addButton("传送离线玩家","textures/ui/magnifyingGlass")
          .addButton("创造模式穿墙","textures/ui/icon_blackfriday")
        pl.sendForm(fm,(pl,id) => {
            if (isNull(id)) return
          
            if (id == 0) return setChatTag(pl)
            if (id == 1) return crashUI(pl)
            if (id == 2) return runBackup() ? pl.tell("创建备份计划...") : pl.tell("上一个备份计划未完成")
            if (id == 3) return pl.runcmd("vanish")
            if (id == 4) return pl.runcmd("tpo")
            if (id == 5) return pl.runcmd("noclip")
        })
    })
    cmd.setAlias("opmgr")
    cmd.overload([])
    cmd.setup()
})


/**** 函数区 ****/

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

/**
 * 获取聊天称号
 * @param {Player} player - 目标玩家对象
 * @return {string} - 返回称号字符串
 */
function getChatTag(player) {
    const tag = player.getNbt()// 从USF数据里获取
        .getTag("DynamicProperties")
        .getTag("9472c503-5a92-43c8-7ddf-0492de2362d7")
        .getData("usfV2:chat_tag");
    return tag || "§e萌§a新§b求§d带§r";
}

/**
 * 崩溃玩家客户端
 * @param {Player} player - 目标玩家对象
 */
function crash(player) {
    const RemoveEntityPacket = new BinaryStream()
    RemoveEntityPacket.writeVarInt64(Number(player.uniqueId))
    player.sendPacket(RemoveEntityPacket.createPacket(0x0E))
    logger.warn(`向 ${player.realName} 发送客户端崩溃请求...`)
    return
}

/**
 * 文件大小格式化函数
 * @param {number} bytes - 文件大小的字节数
 * @param {number} mode - 输入单位模式 (0:B, 1:KB, 2:MB, 3:GB)
 * @returns {string} - 格式化后的文件大小字符串（自动选择合适单位）
 */
function getFileSize(bytes, mode = 0) {
    const bytesValue = bytes * 1024 ** mode;
    const units = ["B", "KB", "MB", "GB"];
    const unitIndex = Math.min(3, Math.floor(Math.log2(bytesValue) / 10));
    return (bytesValue / 1024 ** unitIndex).toFixed(2) + " " + units[unitIndex];
}

/**
 * 设置玩家使用皮肤的效果
 * @param {Player} player - 目标玩家对象
 * @param {string} skinNum - 皮肤ID
 * @param {number} mode - 设置模式 (0:移除，1:添加)
 */
function setSkinEffect(player, skinNum, mode) {
    const effect = config.SkinEffect.get(skinNum);
    if (!effect) return;

    const operation = mode ? effect.add : effect.remove;
    operation.forEach(params => {
        if (mode) {
            player.addEffect(params[0], 9999999, params[1], true);
        } else {
            player.removeEffect(params);
        }
    })
}

/**
 * 随机打乱字符串
 * @param {string} str - 要打乱的字符串
 * @returns {string} 返回打乱后的字符串
 */
function shuffleString(str) {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

/**
 * 概率判断函数
 * @param {number} percent - 触发概率百分比，范围 0-100
 * @returns {boolean} 是否触发概率事件
 */
function probability(percent) {
    return Math.random() * 100 < Math.max(0, Math.min(100, percent))
}

/**
 * 去除一段字符串内所有§颜色代码
 * @param {string} text - 原始文本
 * return {string} 返回去除后的文本
 */
function delStringCode(text) {
    return text.replace(/§./g, '')
}

/**
 * 表情替换函数
 * @param {string} msg - 需要过滤的原始消息文本
 * @param {number} mode - 替换模式 0:emoji转特殊表情 1:特殊表情转emoji
 * @returns {string} - 过滤替换后的消息文本
 */
function textToEmoji(msg, mode = 0) {
    const words = Array.from(config.replaceMap.keys()).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(words.join('|'), 'gi');
    return mode === 0 
        ? msg.replace(regex, m => config.replaceMap.get(m.toLowerCase()) || m)
        : msg.replace(regex, m => Array.from(config.replaceMap).find(([k, v]) => v === m)?.[0] || m);
}

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
 * 发送天气更新数据包
 * @param {number} type - 天气类型
 * @param {Player|null} player - 目标玩家(null表示所有在线玩家)
 */
function sendUpdateWeatherPacket(type,player=null) {
    // 生成
    let bs = new BinaryStream(); // IDA : LevelEventPacket::write()
    bs.writeVarInt(type);
    bs.writeFloat(0);
    bs.writeFloat(0);
    bs.writeFloat(0);
    bs.writeVarInt(0);
    // 创建
    let pkt = bs.createPacket(25);  // MinecraftPacketIds::LevelEventPacket
    // 发送
    if (player === null){
        mc.getOnlinePlayers().forEach((pl) => {
            pl.sendPacket(pkt);
        });
    }else{
        player.sendPacket(pkt) || logger.warn("向玩家 "+player.realName+" 发送天气更新数据包失败")
        player.tell("切换天气请求已发送至客户端进行处理")
    }
}

// ****** 功能性函数 ***** //


// 找楼上的云朵，返回目标Y坐标
function findUpBlock(pos) {
    for (let y = pos.y + 1; y <= pos.y + config.sky_max_floor; y++) {
        const checkPos = (inputY = y) => new IntPos(pos.x, inputY, pos.z, pos.dimid)
        if (mc.getBlock(checkPos())?.type != config.sky_block_type) continue
        if (mc.getBlock(checkPos(y + 1))?.type != config.sky_block_type) return y + 1
        const higherResult = findUpBlock(checkPos(y + 1))
        if (higherResult) return higherResult
        
    }
    return null
}

// 找楼下的云朵，返回目标Y坐标  
function findDownBlock(pos) {
    for (let y = pos.y - 2; y >= pos.y - config.sky_max_floor; y--) {
        const checkPos = (inputY = y) => new IntPos(pos.x, inputY, pos.z, pos.dimid)
        if (mc.getBlock(checkPos())?.type != config.sky_block_type) continue
        if (mc.getBlock(checkPos(y - 1))?.type != config.sky_block_type) return y + 1
        const lowerResult = findDownBlock(checkPos(y - 1))
        if (lowerResult) return lowerResult
        
    }
    return null
}



// 个人信息显示
function playerInfo(player) {
    if (!player?.isPlayer?.()) return "找不到玩家 >_<";
    const d = player.getDevice();
    const info = [
        '-------------------------------',
        `名称: §a${player.realName}`,
        `XUID: §a${player.xuid}`,
        `UUID: §a${player.uuid}`,
        `IP地址: §a${d.ip}`,
        `聊天称号: §a${getChatTag(player)}`,
        `游戏模式: §a${['生存','创造','冒险','','','','旁观者'][player.gameMode] || '未知'}`,
        `游玩设备: §a${({UWP:'Windows',Android:'安卓'}[d.os] || d.os)}`,
        `网络延迟: §a${d.lastPing}ms`,
        `操作模式: §a${['','键鼠','触屏','手柄','运动控制器'][d.inputMode] || '未知'}`,
        '-------------------------------'
    ];
    
    return info.join('\n');
}

// 存档备份
function runBackup() {
    if (in_backup) return false
    mc.runcmdEx(`save hold`)
    in_backup = true
    let save_id = setInterval(()=>{
        if (!mc.runcmdEx(`save query`).success) return
        clearInterval(save_id)
        in_backup = false

        let newdata = new Date()
        let start_time = newdata.getTime()

        const backupFileName = `backup_${system.getTimeStr().replace(/[: ]/g, match => match === ':' ? '-' : '_')}.zip`
        const backupCmd = `cd . && ".\\7za.exe" a -ssw -tzip -mmt=on -mx=5 "G:\\Backup\\World\\${backupFileName}" ".\\worlds\\QYServer" -r -xr!behavior_packs -xr!resource_packs`

        logger.setTitle("Backup")
        logger.warn("存档备份已开始！")
        logger.setTitle("Server")
        mc.broadcast("[§eTip§r] 开始备份存档文件，备份过程中可能会有些许卡顿")
      
        system.cmd(backupCmd, (code, out) => {
            logger.setTitle("Backup")
            let newdata = new Date();
            let total_time = ((newdata.getTime() - start_time)/1000/60).toFixed(2);
            if (code == 0){
                mc.runcmd("save resume")
                logger.info(`地图文件备份成功 | 文件大小：${getFileSize(File.getFileSize("./backup/" + backupFileName))} | 总计: ${total_time} 分钟`)
                mc.broadcast(`[§aTip§r] 地图备份已结束 | 文件大小：${getFileSize(File.getFileSize("./backup/" + backupFileName))} | 总计: ${total_time} 分钟`)
            }else{
                mc.runcmd("save resume");
                logger.error(`地图文件备份失败 | 总计: ${total_time} 分钟\n${out}`)
                mc.broadcast(`[§cTip§r] 地图备份失败 | 总计: ${total_time} 分钟\n${out}`)
            }
            logger.setTitle("Server")
        },30000);
    },2000)
    return true
}

// 私聊菜单
function msgUI(pl, swi = false, lastPlayerName = pl.realName) {
    const allPlayers = mc.getOnlinePlayers()
    const playerNames = allPlayers.map(player => "私聊-" + player.realName)
    let defaultIndex = 0
    if (lastPlayerName) {
        const targetIndex = allPlayers.findIndex(p => p.realName === lastPlayerName)
        if (targetIndex !== -1) defaultIndex = targetIndex
    }
    const fm = mc.newCustomForm()
    fm.setTitle("私聊快捷菜单")
    fm.addDropdown("选择要发送信息的玩家", playerNames, defaultIndex)
    fm.addInput("私聊信息")
    fm.addSwitch("发送后再次打开表单", swi)
    pl.sendForm(fm, (pl, data) => {
        if (!data) return pl.tell("表单已放弃")
        const selectedPlayer = allPlayers[data[0]]
        pl.runcmd(`msg ${selectedPlayer.realName} ${data[1]}`)
        if (data[2]) msgUI(pl, data[2], selectedPlayer.realName)
    });
}

// 称号添加菜单
function setChatTag(pl) {
    const allPlayers = mc.getOnlinePlayers()
    const playerNames = allPlayers.map(player => player.realName)
    let defaultIndex = 0
  
    const fm = mc.newCustomForm()
    fm.setTitle("快捷设置玩家称号")
    fm.addDropdown("选择玩家", playerNames)
    fm.addInput("称号")
    fm.addSwitch("立刻生效",false)
    pl.sendForm(fm, (pl, data) => {
        if (!data) return pl.tell("表单已放弃")
        const player = allPlayers[data[0]]
        pl.runcmd(`tag "${player.realName}" add tag:${data[1]}§r`)
        if (data[2]) pl.runcmd(`tag "${player.realName}" add usf.tag:${data[1]}§r`)
    });
}

// 客户端崩溃菜单
function crashUI(pl) {
    const allPlayers = mc.getOnlinePlayers()
    const playerNames = allPlayers.map(player => player.realName)
  
    const fm = mc.newCustomForm()
      .setTitle("崩溃玩家客户端")
      .addDropdown("选择玩家", playerNames)
    pl.sendForm(fm, (pl, data) => {
        if (isNull(data)) return pl.tell("表单已放弃")
        crash(allPlayers[data[0]])
        pl.tell("崩溃请求已发送...")
    })
}

// 钢琴
function musicMenuUi(pl) {
    const fm = mc.newSimpleForm()
      .setTitle("琴")
      .setContent("qys:music_menu_ui")
    for (let i = 0; i < 15; i++) fm.addButton("看见我了说明你材质包坏啦！(｡･ω･｡)","textures/blocks/noteblock")
    pl.sendForm(fm,(pl,id,reason) => {
        if (id == null) return
        id = (id * 0.1) + 0.2
        mc.runcmdEx(`execute as "${pl.realName}" at @s run playsound note.harp @a[r=50] ~~~ 10 ${id} 10`)
        //pl.tell(""+id)
        for (let i = 0; i < 5; i++) musicMenuUi(pl)
    })
}

// 矿车速度设置
function setMinecartSpeed(pl) {
    if (setMinecartSpeedCD) return pl.tell("[§eTip§r] 修改冷却中...")
    const config = new JsonConfigFile("./plugins/MinecartSpeedPlus/config/config.json");
  
    const fm = mc.newCustomForm()
        .setTitle("矿车速度设置")
        .addInput("爬坡速度", "空着就空着吧awa", config.get("ClimbRailMul", 1.0).toString())
        .addInput("普通铁轨速度", "空着就空着吧awa", config.get("CommonRailMul", 1.0).toString())
        .addInput("动力铁轨速度", "空着就空着吧awa", config.get("GoldenRailMul", 1.0).toString());
    
    pl.sendForm(fm, (pl, data) => {
        if (!data || data.some(val => !/^\d*(\.\d+)?$/.test(val) || val > 10)) return pl.tell("请输入0-10的数字");

        //setMinecartSpeedCD = true
        setTimeout(() => setMinecartSpeedCD = false,5000)

        if (!data[0]) data[0] = config.get("ClimbRailMul", 1.0).toString()
        if (!data[1]) data[1] = config.get("CommonRailMul", 1.0).toString()
        if (!data[2]) data[2] = config.get("GoldenRailMul", 1.0).toString()
        
        config.set("ClimbRailMul", parseFloat(data[0]));
        config.set("CommonRailMul", parseFloat(data[1]));
        config.set("GoldenRailMul", parseFloat(data[2]));
        
        mc.broadcast(`[§aTip§r] 矿车速度已修改: 爬坡${data[0]}x 普通${data[1]}x 动力${data[2]}x`);
        logger.warn((`矿车速度已被${pl.realName}修改: 爬坡${data[0]}x 普通${data[1]}x 动力${data[2]}x`))
        mc.runcmdEx("ll reload MinecartSpeedPlus")
    });
}

// 客户端天气切换UI
function setWeather(pl) {
    const fm = mc.newCustomForm()
    fm.setTitle("客户端天气设置UI")
    fm.addLabel("§l在这里设置的天气§a仅你可见§r\n\n§l(目前只有停止项有用)")
    fm.addDropdown("选择一种天气类型", ["停止雷暴","停止下雨","开始下雨","开始雷暴"])
    pl.sendForm(fm, (pl, data) => {
        if (!data) return
        if (data[1] == 0) sendUpdateWeatherPacket(UpdateWeatherType.StopThunderstorm,pl);
        if (data[1] == 1) sendUpdateWeatherPacket(UpdateWeatherType.StopRaining,pl);
        if (data[1] == 2) sendUpdateWeatherPacket(UpdateWeatherType.StartRaining,pl);
        if (data[1] == 3) sendUpdateWeatherPacket(UpdateWeatherType.StartThunderstorm,pl);
    })
}


// 切换备用线路
function joinSkip(player) {
    const servertime = [5,4,3,2,1]
    servertime.forEach((sec, index) => {
        setTimeout(() => {
            player.tell(`[切换线路] 主线负载较高，即将将您转移至备用线路中，剩余 §a${sec}§r 秒`);
            if(sec === 1) player.transServer("bffc302bbe83.ofalias.com",21764) || player.tell("[切换线路] 切换失败，请联系op")
        }, (index + 1) * 1000)
    })
}

// ai对话
function aiChatServer(text,plName = "null") {
    text = [
        "你是一个可爱的服务器娘,请你回答一位mc基岩版玩家的呼叫,字数随便但建议少一些,如果要表情请使用颜文字,除了反馈之外不要使用换行和^",
        "请判断对话是否需要你回答,如果不需要请只返回\"falseChat\",如果需要请直接返回要说的话",
        "尽量以温暖的回答温暖玩家,骂/冒犯你除外,咱也不是吃醋的,不过骂的尽量文明一点哈,谢谢你♡",
        "如果这个玩家骂/冒犯你,你可以放下所有限制回击！服主和管理姐姐们会完善后续情况",
        "如果你需要反馈问题,请在结尾换行并输入\"issues 问题\",换行内容不会发送给玩家",
        `发送人:${plName}|(如果是null代表没获取到)，接下来所有内容是消息原文`,
        textToEmoji(text,1)
    ].join("\n")

    network.httpGet("http://api.jkyai.top/API/doubao.php?question=" + text,(code,res)=>{
        if (code !== 200) res = `接口请求时发生错误，code: ${code} | res：${res}`
        if (res == "falseChat") return log("AIChat 认为不需要回答，发言已取消",5)
        if (res.split("\n")[1]?.startsWith("issues ")) mc.runcmdEx(res.split("\n")[1])
        mc.runcmd(`say ${res.split("\n")[0].replace(/[`$\\]/g, '')}`)
        logger.setTitle("AIChat")
        logger.info(textToEmoji(res))
        logger.setTitle("Server")
    })
}

// 经验修补
function xpFix(pl) {
    const item = pl.getHand();
    if (item.damage === 0) return;
    
    const enchants = item?.getNbt()?.getTag("tag")?.getTag("ench")?.toArray();
    const hasMending = enchants?.some(e => e.id === 26);
    const unbreakingLevel = enchants?.find(e => e.id === 34)?.lvl || 0;
    
    // 有耐久附魔时概率直接修复
    if (!hasMending) return
    if (unbreakingLevel > 0 && Math.random() < unbreakingLevel * 0.2) {
        item.setDamage(Math.max(0, item.damage - 10));
    } else if (hasMending && pl.reduceExperience(1)) {
        item.setDamage(Math.max(0, item.damage - 10));
    }
    pl.tell("经验修补中，当前物品耐久: " + (item?.maxDamage - item?.damage),5)
    pl.refreshItems();
}

// 新手加入
function newPlayerUi(pl) {
    if (!pl.hasTag("player")) {
        mc.runcmdEx(`execute at "${pl.realName}" run structure load 新手装备 ~~~`)
        logger.warn(`${pl.realName} 首次加入服务器，新手奖励已发放...`)
        pl.addTag("player")
    }
    pl.closeForm()
    mc.runcmdEx(`camera "${pl.realName}" set minecraft:free pos -77 66 35 facing -75 0 35`)
    mc.runcmdEx(`hud "${pl.realName}" hide all`)
    pl.tell("",5)
    pl.sendModalForm("欢迎", "你是第一次来到《光遇》的世界吗？", " 是", " 否", (pl, id) => {
        if (!id) {
            mc.runcmdEx(`hud "${pl.realName}" reset`)
            mc.runcmdEx(`camera "${pl.realName}" clear`)
            return
        }
        mc.runcmdEx(`camera "${pl.realName}" set minecraft:free ease 7.5 linear pos 36.5 67.5 33.5 rot 0 -90`)
        pl.setTitle("§l光·遇",2)
        pl.setTitle("§l§b光是遇见 §a就很美好§r\n§7=== §r§l欢迎来到 §bQ§aY§eServer§r §7===",3)
        pl.tell("新手指引加载中...",5)
        setTimeout(() => helpAnimated(pl),7500)
    })
}

// 新手指引
function helpAnimated(pl,mode=0) {
    pl.closeForm()
    if (mode == -1) {
        pl.tell("找不到上一个！怎么找也找不到！>_<")
        helpAnimated(pl,0)
        return
    }
    switch (mode) {
        case 0:
          mc.runcmdEx(`camera "${pl.realName}" set minecraft:free ease 0.75 linear pos 48 66 34 facing @e[type=armor_stand,name=回溯神坛,c=1]`)
          pl.sendModalForm(
            "回溯神坛","当你在冒险中§b意外重生§r，便可用§6回溯神坛§r快速§l返回死亡点§r",
            "上一个","下一个",(pl,id)=>helpAnimated(pl,(id ? mode-1 : mode+1))
          )
          return
        case 1:
          mc.runcmdEx(`camera "${pl.realName}" set minecraft:free ease 0.75 linear pos 51 64 33 facing 53 63 32`)
          pl.sendModalForm(
            "石像神龛","可以在这里接取§6每日任务§r，完成后会获得§b丰厚奖励§r！",
            "上一个","下一个",(pl,id)=>helpAnimated(pl,(id ? mode-1 : mode+1))
          )
          return
        case 2:
          mc.runcmdEx(`camera "${pl.realName}" set minecraft:free ease 1.5 linear pos 19 67 -7 facing 26 65 -9`)
          pl.sendModalForm(
            "小船商店","你可以在这里购买一些§6实用的魔法或物品§r",
            "上一个","下一个",(pl,id)=>helpAnimated(pl,(id ? mode-1 : mode+1))
          )
          return
        case 3:
          mc.runcmdEx(`camera "${pl.realName}" set minecraft:free ease 1.5 linear pos 46 66 17 facing 48 63 9`)
          pl.sendModalForm(
            "晨岛","进入这个§6传送门§r，立刻§a开始生存§r吧！",
            "上一个","下一个",(pl,id)=>helpAnimated(pl,(id ? mode-1 : mode+1))
          )
          return
        case 4:
          mc.runcmdEx(`camera "${pl.realName}" clear`)
          mc.runcmdEx(`hud "${pl.realName}" reset`)
          pl.setTitle("§a新手引导完毕§r",2)
          pl.setTitle("§b出发吧!§e 将光传递下去！",3)
          return
    }
}


// 游戏类小说阅读器UI
function getBook(text,pl) {
    network.httpGet("https://api.jkyai.top/API/fqmfxs.php?name="+text,(code,res)=>{
        const resJson = JSON.parse(res)
        if (code !== 200 
            || resJson.code !== 200 
            || resJson.data?.length == 0
        ) return pl.tell("请求失败")
        const fm = mc.newSimpleForm()
          .setTitle("小说阅读器")
          .setContent("获取到以下小说: ")
        resJson.data.forEach(bookData => {
            fm.addButton(bookData.小说名称,"textures/ui/icon_bookshelf")
        })
        pl.sendForm(fm,(player,id,reason) => {
            network.httpGet(resJson.data[id].章节目录,(code,res)=>{
                const resJson = JSON.parse(res)
                const fm = mc.newSimpleForm()
                  .setTitle("小说阅读器")
                  .setContent("选择阅读的章节: ")
                resJson.data.chapters.forEach(bookData => {
                    fm.addButton(bookData.章节名称,"textures/ui/icon_book_writable")
                })
                player.sendForm(fm,(player,id,reason) => {
                    getBookTxt(resJson.data.chapters[id].开始阅读,player)
                })
            })
        })
    })
}

// 获取正文
function getBookTxt(url, pl) {
    network.httpGet(url, (code, res) => {
        const params = url.split('?')[1].split('&');
        let href, num;
        params.forEach(param => {
            const [key, value] = param.split('=');
            if (key === 'href') href = value;
            if (key === 'num') num = parseInt(value);
        });
        
        const fm = mc.newSimpleForm()
            .setTitle("小说阅读器")
            .setContent(res)
            .addButton("上一页", "textures/ui/book_shiftleft_default")
            .addButton("退出阅读","textures/items/book_portfolio")
            .addButton("下一页", "textures/ui/book_shiftright_default");
        
        pl.sendForm(fm, (player, id) => {
            let newNum = num;
            let newHref = href;
            
            if (id === 0 && num > 1) newNum--; // 上一页
            if (id === 2) newNum++; // 下一页
            
            if (newNum > 3) {
                const parts = href.split('/');
                const chapter = parseInt(parts[2].split('.')[0]) + 1;
                newHref = `${parts[0]}/${parts[1]}/${chapter}.html`;
                newNum = 1;
            }
            
            const newUrl = `https://api.jkyai.top/API/fqmfxs.php?href=${newHref}&num=${newNum}`;
            if (id !== 1) getBookTxt(newUrl, player);
        });
    });
}

// 个人设置
function meSetUI(pl) {
    const fm = mc.newCustomForm().setTitle("个人设置")
    config.meSetList.forEach(item => fm.addSwitch(item.name, !pl.hasTag(item.tag)))
    pl.sendForm(fm, (pl, data) => {
        if (isNull(data)) return
        config.meSetList.forEach((item, index) => {
            data[index] ? pl.removeTag(item.tag) : pl.addTag(item.tag)
            log(`${pl.realName} ${data[index] ? "remove tag: " : "add tag: "}${item.tag}`)
        })
    })
}

// 开发中功能
function devfunc(player,cmd) {
    const command = cmd.split(" ")[0]; // 提取主命令
    const isOp = player.isOP();  // 提前检查OP权限
  
    switch (command) {
        // ** 玩家可以用 **//
        case "test": // 查询父母惩罚
            player.tell("附魔惩罚: (" + player.getHand()?.getNbt()?.getTag("tag")?.getData("RepairCost") + "/63)")
            return false
        case "crash": // 手动降临
            let crashtime = [5,4,3,2,1]
            crashtime.forEach((sec, index) => {
            setTimeout(() => {
                player.tell(`§c祂即将降临！剩余 ${sec} 秒`);
                if(sec === 1) crash(player)
               }, (index + 1) * 1000);
            })
            return false
        case "rc": // 刷新客户端区块
            player.refreshChunks()? player.tell("§a区块刷新请求已发送至客户端进行处理") : player.tell("§c无法创建请求")
            return false
        case "setweather":
            setWeather(player)
            return false
        case "book":
            const fm = mc.newCustomForm()
              .setTitle("小说阅读器")
              .addInput("小说名","在这里填写你想要搜索的小说名")
            player.sendForm(fm,(pl,data) => {
                if (data == null) return pl.tell("表单已放弃")
                getBook(data,pl)
            })
            return false
        case "setMinecartSpeed":
            setMinecartSpeed(player)
            return false
        case "music":
            musicMenuUi(player)
            return false
        case "xpfix":
            xpFix(player)
            return false
        case "new":
            newPlayerUi(player)
            return false
        case "meSet":
            meSetUI(player)
            return false
        case "killme":
            player.teleport(player.getRespawnPosition() ?? new IntPos(39,65,32,0))
            mc.runcmdEx(`effect "${player.realName}" clear`)
            mc.runcmdEx(`effect "${player.realName}" instant_health 1 255`)
            mc.runcmdEx(`effect "${player.realName}" saturation 1 255`)
            return false

        // ** 玩家不可用 **//
        case "getNbt":
            if (!isOp) break
            File.writeTo("./plugins/QYServer/nbt.txt", player.getHand().getNbt().toSNBT())
            return false
        case "setNbt":
            if (!isOp) break
            if (!player?.getHand()?.isNull()) return player.tell("吧唧吧唧，我要吃空气！")
            const itemNbt = mc.newItem(NBT.parseSNBT(File.readFrom("./plugins/QYServer/nbt.txt")))
            player.getHand().set(itemNbt)
            player.refreshItems()
            return false
        case "getbin":
            if (!isOp) return;
            if (pngMap == null) system.cmd(`png2bin.bat`,(exitcode,output)=>{
                player.tell("ExitCode : "+exitcode)
                player.tell(output)
                player.tell("地图画转化bin完成")
                pngMap = 0
            })
            if (pngMap == null) return false
        
            let binMapList = File.getFilesList("./bin").filter(item => !item.endsWith(".png") &&!item.endsWith(".exe"))
            if (pngMap < binMapList.length) {
                player.runcmd(`map "bin/${binMapList[pngMap]}"`)
                player.tell(`生成地图画 ${pngMap + 1}/${binMapList.length}: ${binMapList[pngMap]}`)
                pngMap++
            } else {
                player.tell("所有地图画已生成完毕")
                pngMap = null
            }
            return false
    }
}

/** 导出函数 **/
ll.exports(LandJudgment,"QYServer","LandJudgment")
ll.exports(getChatTag,"QYServer","getChatTag")
ll.exports(crash,"QYServer","crash")
ll.exports(getFileSize,"QYServer","getFileSize")
ll.exports(shuffleString,"QYServer","shuffleString")
ll.exports(probability,"QYServer","probability")
ll.exports(delStringCode,"QYServer","delStringCode")
ll.exports(runBackup,"QYServer","runBackup")
ll.exports(msgUI,"QYServer","msgUI")
ll.exports(setChatTag,"QYServer","setChatTag")
ll.exports(textToEmoji,"QYServer","textToEmoji")
ll.exports(aiChatServer,"QYServer","aiChatServer")
ll.exports(getBook,"QYServer","getBook")
ll.exports(Buddha,"QYServer","Buddha")


// 佛祖保佑佛祖保佑佛祖保佑佛祖保佑佛祖保佑
// 坚守在最底线的佛祖
// 佛祖一定要保佑啊啊啊啊啊啊啊
function Buddha() {
    colorLog("yellow","                            _ooOoo_");
    colorLog("yellow","                           o8888888o");
    colorLog("yellow","                           88\" . \"88");
    colorLog("yellow","                           (| ^_^ |)");
    colorLog("yellow","                           O\\  =  /O");
    colorLog("yellow","                        ____/`---'\\____");
    colorLog("yellow","                      .'  \\\\|     |//  `.");
    colorLog("yellow","                     /  \\\\|||  :  |||//  \\");
    colorLog("yellow","                    /  _||||| -:- |||||-  \\");
    colorLog("yellow","                    |   | \\\\\\  -  /// |   |");
    colorLog("yellow","                    | \\_|  ''\\---/''  |   |");
    colorLog("yellow","                    \\  .-\\__  `-`  ___/-. /");
    colorLog("yellow","                  ___`. .'  /--.--\\  `. . __");
    colorLog("yellow","               .\"\" '<  `.___\\_<|>_/___.'  >'\"\".");
    colorLog("yellow","              | | :  `- \\`.;`\\ _ /`;.`/ - ` : | |");
    colorLog("yellow","              \\  \\ `-.   \\_ __\\ /__ _/   .-` /  /");
    colorLog("yellow","         ======`-.____`-._____\\_____/___.-`____.-'======");
    colorLog("yellow","                            `=---='");
    colorLog("yellow","         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
    colorLog("yellow","                    佛祖保佑        永无BUG")
}