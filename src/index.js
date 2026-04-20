import { Minecraft, Recipes, I18nAPI } from '../../GMLIB-LegacyRemoteCallApi/lib/GMLIB_API-JS.js';
import { PAPI } from '../../GMLIB-LegacyRemoteCallApi/lib/BEPlaceholderAPI-JS.js';
import * as il from "../../iListenAttentively-LseExport/lib/iListenAttentively.js";

import { config } from "../Config/config.js";
import * as func from "./lib/func.js";
logger.setTitle("Server");

// 初始化变量
let is_reload = (mc.getOnlinePlayers().length != 0);

PAPI.registerPlayerPlaceholder(func.getChatTag, "QYServer", "player_chatTag"); // 注册PAPI
mc.listen("onEndermanTakeBlock", () => false); // 防搬方块
mc.listen("onWitherBossDestroy", () => false); // 凋零防爆
mc.listen("onRespawnAnchorExplode", (pos, pl) => {// 重生毛爆炸
    if (pos.dimid === 0) {
        pl.tell("不要在主世界使用重生猫啊喂！");
        return false;
    }
});

// 服务器启动后事件
mc.listen("onServerStarted", () => {
    setTimeout(() => { is_reload = false }, 10);
    ll.onUnload(() => mc.runcmd("scriptevent qys:command noChat false"));
    mc.runcmd("scriptevent qys:command noChat true");

    if (is_reload) return logger.warn("QYServer core component restart...");

    il.emplaceListener("lac::punish::PlayerBanWaveEvent", (i) => mc.broadcast(`§e${i.self.toPlayer().realName} 被反作弊娘吃掉了 (｡･ω･｡)`)); // 监听反作弊提出
    il.emplaceListener("lac::punish::PlayerCheatEvent", (i) => i.self.toPlayer().tell("§e注意！您已被反作弊娘注视！")); // 监听反作弊提出

    const sclist = mc.getAllScoreObjectives().filter(sc => sc.name.startsWith("farmersdelight:"));
    if (sclist.length >= 10) sclist.forEach(sc => mc.removeScoreObjective(sc.name));

    setTimeout(() => {
        mc.runcmd("reload"); // 修复函数包不加载
        mc.runcmd("scriptevent qys:command noChat true");
    }, 3000);

    // === 合成表相关类 === //

    // 注销
    Recipes.unregisterRecipe("minecraft:bundle"); // 收纳袋
    Recipes.unregisterRecipe("minecraft:brew_awkward_slime_block"); // 渗浆药水
    Recipes.unregisterRecipe("minecraft:brew_awkward_stone"); // 虫蚀

    // 注册无序工作台合成表
    Recipes.registerShapelessRecipe("qys:santahat", [// 圣诞帽
        "minecraft:leather_helmet",
        "minecraft:red_dye",
        "minecraft:white_dye"
    ], "qys:santa_hat", 1, "None");

    Recipes.registerShapelessRecipe("qys:nametagitem", [// 命名牌
        "minecraft:iron_nugget",
        "minecraft:paper"
    ], "minecraft:name_tag", 2, "None");

    // 注册切石机合成表
    Recipes.registerStoneCutterRecipe("qys:amethyst", "amethyst_block", 0, "amethyst_shard", 0, 4); // 紫水晶
})

// 玩家连接世界
mc.listen("onPreJoin", () => {
    if (is_reload) return
    mc.runcmdEx("playsound custom.online_sound @a")
})

// 玩家加入事件
mc.listen("onJoin", (player) => {
    if (!player || !player.inWorld) return;
    if (config.banName.has(player.realName)
        || config.banXuid.has(player.xuid)
        || config.banClient.has(player.getDevice().clientId)
    ) return func.crash(player);
    if (!player.hasTag("player")) newPlayerUi(player);
    if (!is_reload) func.enRuncmd(player, "function function/Server/player_initializ");
})

// 玩家离开游戏
mc.listen("onLeft", (player) => {
    mc.runcmdEx(`kill @e[type=qys:ride,name="qys:rideing_${player.realName}"]`)
})

// 生物骑乘
mc.listen("onRide", (rider, mount) => {
    if (mount.type === "minecraft:ender_dragon" && !rider.hasTag("qys:ride_ender_dragon")) return false;
})

// 活塞尝试推动
mc.listen("onPistonTryPush", (_pos, block) => {
    if (block.type.includes("shulker_box")) return false;
})

// 后台执行命令
mc.listen("onConsoleCmd", (cmd) => {
    if (cmd === "") return false
    const args = cmd.split(" ")

    switch (cmd) {
        case "reload":
            setTimeout(() => mc.runcmd("scriptevent qys:command noChat true"), 2000)
            return
        case "testfor":
            mc.getOnlinePlayers().forEach(pl => log(`${pl.realName} -> ${func.enRuncmd(pl, "testfor @e[r=160]").output?.split(", ")?.length}`))
            return false
        case "tps":
            logger.info(mc.runcmdEx("cleaner tps").output)
            return false
        case "mspt":
            logger.info(mc.runcmdEx("cleaner mspt").output)
            return false
        case "list -v":
            mc.getOnlinePlayers().forEach(pl => logger.info(PAPI.translateString("%player_realname% version %player_client_version%", pl)))
            return false
        case "list -i":
            mc.getOnlinePlayers().forEach(pl => {
                const dev = pl.getDevice()
                logger.info(func.mcCode2Ansi(`${pl.realName} §a-ping §l${dev.avgPing}ms§r §b-os §l${dev.os}§r §e-ip §l${dev.ip}§r §d-clientId §l${dev.clientId}§r`))
            })
            return false
    }

    switch (args[0]) {
        case "say":
            ll.imports("BehaviorLog_WriteLog")("后台喊话", "Server", "服务器娘", "", "", "", "", "", "", "", `${cmd}`, false, true)
            return
    }
})

// 玩家发送聊天信息
mc.listen("onChat", (player, msg) => {
    const dim = { 0: "§b主世界§r", 1: "§c下界§r", 2: "§d末地§r" }[player.pos.dimid] || "§9未知§r";
    const tag = func.getChatTag(player);
    const ms = player.getDevice()?.avgPing > 100 ? `[§c${player.getDevice().avgPing}§rms§r]` : "";

    if (!(player.isOP() || player.hasTag("op"))) msg = msg.replace(/\n/g, '\\n');
    func.titleLog.info("Chat", `<${player.realName}> ${msg}`);
    if (msg[0] === "+") return;
    msg = func.textToEmoji(msg);
    mc.broadcast(`[${tag}][${dim}]${ms}${player.realName} >> ${msg}`, 1);
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
        default:
            mc.runcmdEx("execute as @a at @s run playsound custom.called_sound @s");
            mc.runcmdEx(`execute as "${player.realName}" at @s[m=!spectator] anchored eyes run particle qys:sky_called ~~0.2~`)
            break
    };
})

// 玩家执行命令
mc.listen("onPlayerCmd", (player, cmd) => {
    func.titleLog.info("Command", `<${player.realName}> /${cmd}`);
    switch (cmd) {
        case "reload":
            setTimeout(() => mc.runcmd("scriptevent qys:command noChat true"), 2000);
            return;
        case "msg":
            msgUI(player);
            return false;
        case "testfor":
            player.tell("==============");
            player.tell(`所有实体数: ${mc.runcmdEx("testfor @e").output.split(", ").length}`);
            player.tell("玩家240格附近实体数：");
            mc.getOnlinePlayers().forEach(pl => player.tell(`${pl.realName} -> ${func.enRuncmd(pl, "testfor @e[r=240]").output?.split(", ")?.length}`));
            player.tell("==============");
            return false;
    }
    switch (cmd.split(" ")[0]) {
        case "me":
            player.tell(playerInfo(player));
            return false;
        case "fc":
            if (player.hasTag("qys:no_fc")) return false;
            setTimeout(() => mc.runcmdEx(`ride "${player.realName}" start_riding @e[type=qys:ride,name="qys:rideing_${player.realName}"]`), 250);
            return player.tell("[§aTip§r] 再次输入\"/fc\"开关自由视角");
    }
    return !onmode(player, cmd);
})

// 实体受伤
mc.listen("onMobHurt", (mob, source, _damage, cause) => {
    if (mob?.type === "minecraft:player") {
        if (mob.hasTag("qys:false_creation")) return false; // 假创造用
        if (source?.type === "minecraft:ender_dragon" // 龙骑士调用
            && cause === ActorDamageCause.EntityAttack
            && mob.hasTag("qys:ride_ender_dragon")
        ) return false;
    }
})

// 玩家攻击生物
mc.listen("onAttackEntity", (player, entity) => {
    if (entity.type === "qys:bigcandle" && !player.hasTag("op")) return false;

    if (player.getHand()?.getNbt()?.getTag("tag")?.getData("is32k")) {
        if (entity.type === "minecraft:player") return false;
        if (player.hasTag("op")) return;
        player.getHand()?.setNull();
        return false;
    }

    if (entity.type === "qys:message") {
        const messageName = entity.name.split('\n').pop();
        if (messageName.includes(`${player.realName}§n§a§m§e§校§验`) || messageName.includes(`匿名\n§k${player.realName}§n§a§m§e§校§验`)) {
            player.sendModalForm("留言纸船", "是否删除这条留言？这将无法恢复！", "§c立刻删除§r", "§a我再想想§r", (pl, ui) => {
                if (ui) entity.despawn();
            })
        } else if (player.isOP()) player.sendModalForm("留言纸船", "[OP管理] 是否删除？", "§c立刻删除§r", "§a我再想想§r", (pl, ui) => {
            if (ui) entity.despawn();
        })
    }
})

// 漏斗传输物品
mc.listen("onHopperPushOut", (_pos, isMinecart, item) => {
    if (isMinecart) return;
    if (item.type.includes("bundle")) return false;
})

// 玩家尝试放置方块
mc.listen("onPlaceBlock", (pl, bl) => {
    if (((config.banBlock.has(bl.type) || bl.type.includes("minecraft:element_")) && !pl.isOP())) {
        pl.tell("§c您需要创造模式 + 操作员权限来放置此方块§r");
        pl.refreshChunks();
        return false;
    }
})

// 玩家对方块使用物品
mc.listen("onUseItemOn", (pl, item, block, side, pos) => {
    if (item.type.match("spawn_egg") && pl.gameMode != 1) {
        if (block.type === "minecraft:trial_spawner") return false
        if (block.type === "minecraft:mob_spawner") return false
    }
    if (item.type === "minecraft:camera" && side === 1) {
        setTimeout(() => mc.runcmdEx(`clear "${pl.realName}" camera 1 1`), 100)
        return
    }
})

// 玩家使用物品
mc.listen("onUseItem", (pl, item) => {
    if (item.type === "qys:wing") {
        if (pl.maxHealth === 60) return pl.tell("[§aTip§r] 您的光翼已达上限(" + pl.maxHealth + "/60)")
        pl.setMaxHealth(pl.maxHealth + 1)
        pl.tell("" + func.enRuncmd(pl, "playsound random.orb @s").output)
        return pl.clearItem("qys:wing", 1)
    }
    if (item.type === "qys:magic") return func.enRuncmd(pl, "playsound custom.magic_use_sound @a[r=10] ~~~")
    if (pl.isSneaking && !pl.getHand()?.isNull()) return xpFix(pl)
})

// 生物死亡事件
mc.listen("onMobDie", (mob, source) => {
    if (!mob || !source) return;
    if (source.type !== "minecraft:player") return;
    if (func.probability(15)) mc.spawnItem(mc.newItem("qys:candle_white", 1), mob.pos);
    func.enRuncmd(source.toPlayer(), "function function/killEntity");
})

// 玩家重生事件
mc.listen("onRespawn", (pl) => {
    if (pl.maxHealth > 20) {
        pl.setMaxHealth(pl.maxHealth - 1) // 扣一颗心
        mc.runcmdEx(`playsound custom.Injured_sound "${pl.realName}"`)
    } else {
        pl.setMaxHealth(20); // 心小于20时设置成20
    }
});

// 玩家交互实体
mc.listen("onPlayerInteractEntity", (player, entity) => {
    if (player.hasTag("qys:touch")) func.enRuncmd(entity, "function function/pat");

    if (entity.type.includes("qys:firework_") && !entity.hasTag("qys:firework_open")) {
        if (player.getHand().type !== "minecraft:flint_and_steel") return player.tell("需要用打火机点燃这个烟花!", 5);
        entity.addTag("qys:firework_open");
        entity.addEffect(24, 114514, 20, false);
        func.enRuncmd(entity, "scoreboard players random @s fireworks_time 20 30");
        func.enRuncmd(entity, "playsound custom.firework_front @a[r=13] ~~~");
    }
})

// 玩家坐在椅子上逻辑
const onRideCD = new Set()
mc.listen("onUseItemOn", (player, item, block) => {
    if ((!player.hasTag("qys:free_noclip") && block.type.search(/_(stairs|slab)/) === -1)
        || !item.isNull()
        || player.hasTag("qys:no_sitdown")
        || player.isSneaking
        || onRideCD.has(player.xuid)
        || block?.getNbt()?.getTag("states")?.getData("upside_down_bit") // 楼梯使用
        || block?.getNbt()?.getTag("states")?.getData("minecraft:vertical_half") == "top" // 半砖使用
        || mc.getEntities(block.pos, 0.25).some(e => e.type === "qys:ride")
    ) return;
    onRideCD.add(player.xuid) && setTimeout(() => onRideCD.delete(player.xuid), 40);

    const rotate = { 0: 90, 1: -90, 2: 180, 3: 0 }[block?.getNbt()?.getTag("states")?.getData("weirdo_direction")] || 0;
    mc.runcmdEx(`execute at "${player.realName}" as @e[type=qys:ride,rm=0.01,name="qys:rideing_${player.realName}"] run cleaner despawn @s`);
    mc.runcmdEx(`execute at "${player.realName}" run summon qys:ride "qys:rideing_${player.realName}" ${block.pos.x} ${block.pos.y} ${block.pos.z}`);
    mc.runcmdEx(`execute as @e[type=qys:ride,name="qys:rideing_${player.realName}"] at @s run tp ~~~ ${rotate}`);
    mc.runcmdEx(`tag @e[type=qys:ride,name="qys:rideing_${player.realName}"] add qys:ride_player`);
    setTimeout(() => mc.runcmdEx(`execute as "${player.realName}" at @s run ride @s start_riding @e[type=qys:ride,rm=0.0001,name="qys:rideing_${player.realName}"]`), 2);
})

// **** 循环计时器区 **** //
mc.listen('onServerStarted', () => {
    // if (is_reload) return
    const ms = mc.getScoreObjective("ms")
    let ping = 255

    // 玩家延迟显示
    setInterval(() => {
        mc.getOnlinePlayers().forEach(pl => {
            if (pl.hasTag("qys:in:afk")) return
            ping = pl.getDevice()?.avgPing ?? 255
            if (ms.getScore(pl) !== ping) ms.setScore(pl, ping)
        })
    }, 2 * 1000)

    // 光环耐久扣除
    setInterval(() => {
        mc.getOnlinePlayers().forEach((pl) => {
            if (pl.hasTag("qys:in:afk")) return
            const item = pl.getArmor().getItem(0)
            if (!pl.hasTag("tag:§r§l§d爱心§e捐§a助§b者§r")
                && (item?.type.startsWith("qys:hoshino_") || item?.type.startsWith("qys:shiroko_"))
            ) item.setDamage(Math.max(0, item.damage + 1)) && pl.refreshItems()
        })
    }, 60 * 1000)

    // 一言
    setInterval(() => {
        const text = config.wordList[Math.floor(Math.random() * config.wordList.length)]
        mc.getOnlinePlayers().forEach((pl) => {
            if (!pl.hasTag("qys:no_word")) pl.tell(`${text}`, 5)
        })
    }, config.wordtime * 60 * 1000)

    // 冲撞魔法
    setInterval(() => {
        mc.getOnlinePlayers().forEach(pl => {
            if (!(pl.hasTag("qys:can_speed") && pl.isGliding)) return
            const speed = Math.floor(pl.speed) - 5
            if (speed <= 10) return
            mc.runcmdEx(`execute as "${pl.realName}" at @s run damage @e[r=3.5,rm=0.01,family=monster] ${speed} entity_attack entity @s`)
            pl.tell("speed: " + speed, 3)
        })
    }, 100)

    // 假死检查
    setInterval(() => File.writeTo("./in_run.bin", "" + Date.now()), 5 * 60 * 1000)
})


/***** 命令注册区 *****/

// sinfo - 查询服务器运行状态
mc.listen('onServerStarted', () => {
    const cmd = mc.newCommand('sinfo', '§a查询服务器运行状态', PermType.Any);
    cmd.setCallback((_cmd, _ori, out, _res) => {
        const info = [
            "============ 服务器运行状态 ============",
            `当前时间: ${system.getTimeStr()}`,
            "TPS: %server_tps_colored%",
            "MSPT: %server_mspt_colored%",
            "服务器版本: %server_version%(%server_protocol_version%) - levilamina %levilamina_version%",
            "BDS使用内存: %server_ram_bds_used%",
            "已使用内存: %server_ram_used%",
            "最大内存: %server_ram_max%",
            "空闲内存: %server_ram_free%",
            "在线玩家: %server_online%/%server_max_players%",
            "运行时间: %server_uptime%s",
            "实体总数: %server_total_entities%",
            "============= 数据文件相关 =============",
            `数据库玩家数：${data.getAllPlayerInfo().length} 人`,
            `已加载插件数：${ll.listPlugins().length} 个`,
            `领地数据文件大小：${func.getFileSize(File.getFileSize("./plugins/iland/data.json"))}`,
            `成就数据文件大小：${func.getFileSize(File.getFileSize("./plugins/Achievement/Data.json"))}`,
            `当日日志文件大小：${func.getFileSize(File.getFileSize(`./logs/BehaviorLog/BehaviorLog-${system.getTimeStr().split(" ")[0]}.csv`))}`,
            `日志记录文件总数：${File.getFilesList("./logs/BehaviorLog/")?.length}`,
            "======================================"
        ];
        info.forEach(i => out.success(PAPI.translateString(i)));
    });
    cmd.overload([]);
    cmd.setup();
})

// msgui - 快捷私聊菜单
mc.listen('onServerStarted', () => {
    const cmd = mc.newCommand('msgui', '§a快捷私聊菜单', PermType.Any);
    cmd.setCallback((_cmd, ori, out, _res) => {
        if (!ori.player) return out.error("打不开！怎么样也打不开！");
        return msgUI(ori.player);
    })
    cmd.overload([]);
    cmd.setup();
})

// chattag - 设置聊天称号
mc.listen('onServerStarted', () => {
    const cmd = mc.newCommand('chattag', '§e设置聊天称号', PermType.Any);
    cmd.setCallback((_cmd, ori, out, _res) => {
        const player = ori.player;
        if (!player) return;
        const tagList = player.getAllTags().filter(item => item.startsWith("tag:"));//tagList.unshift("tag:§e萌§a新§b求§d带§r");
        if (tagList.length === 0) return out.success("[§e称号系统§r] >> 未找到可佩戴的称号");
        if (player.hasTag("qys.tag:unset")) return out.success("[§e称号系统§r] >> §c当前称号无法更改");

        const fm = mc.newCustomForm()
            .setTitle("称号设置")
            .addDropdown("选择一个要佩戴的称号\n已佩戴称号: " + func.getChatTag(ori.player), tagList);
        player.sendForm(fm, (pl, data) => {
            if (func.isNull(data)) return;
            mc.runcmdEx(`tag "${pl.realName}" add "usf.${tagList[data]}"`);
            func.enRuncmd(pl, "playsound random.levelup @s ~~~ 10 2");
            setTimeout(() => pl.tell("[§e称号系统§r] >> §a佩戴成功, 已佩戴称号§r: " + tagList[data].replace(/^tag:/, "")), 20);
        });
    })
    cmd.overload([]);
    cmd.setup();
})

// offhand - 主副手切换
mc.listen('onServerStarted', () => {
    const cmd = mc.newCommand('offhand', '§a主副手切换', PermType.Any);
    cmd.setCallback((_cmd, ori, out, _res) => {
        const player = ori.player;
        if (func.isNull(player)) return;
        if (player.getHand()?.getNbt()?.getTag("tag")?.getData("PickUp")) return out.error("请放下搬运物再使用吧");
        const itemBak = player.getHand().clone();
        player.getHand().set(player.getOffHand());
        player.getOffHand().set(itemBak);
        player.refreshItems();
        out.success(`§a已交换手部物品`);
        out.success(`§a您可能需要切换快捷栏来刷新物品`);
    });
    cmd.overload([]);
    cmd.setup();
})

// helmet - 头部盔甲互换
mc.listen('onServerStarted', () => {
    const cmd = mc.newCommand('helmet', '§a头部盔甲切换', PermType.Any);
    cmd.setCallback((_cmd, ori, out, _res) => {
        const player = ori.player;
        if (func.isNull(player)) return;
        if (player.getHand()?.getNbt()?.getTag("tag")?.getData("PickUp")) return out.error("请放下搬运物再使用吧");
        const itemBak = player.getHand().clone();
        player.getHand().set(player.getArmor().getItem(0));
        player.getArmor().getItem(0).set(itemBak);
        player.refreshItems();
        out.success(`§a已交换头盔与主手物品`);
        out.success(`§a您可能需要切换快捷栏来刷新物品`);
    });
    cmd.overload([]);
    cmd.setup();
})

// scale - 自定义大小
mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand("scale", "§b自定义大小", PermType.Any);
    cmd.optional('Int', ParamType.Int, 1);
    cmd.overload(['Int']);
    cmd.setCallback((_cmd, ori, out, res) => {
        // return out.error("The \"/scale\" command is not supported anymore.")
        const player = ori.player;
        if (!player) return;
        if (func.isNull(res.Int)) {
            player.setScale(1);
            return out.success("大小已恢复为默认值");
        }
        if (res.Int > 35) return out.success("最大不能超过35!");
        if (res.Int < -2) return out.success("最小不能低于-2!");
        player.setScale(res.Int);
        out.success(`大小已修改为${res.Int}倍！`);
    });
    cmd.setup();
})


// issues - 反馈问题
mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand("issues", "§b反馈问题", PermType.Any);
    cmd.optional('text', ParamType.RawText);
    cmd.setCallback((_cmd, ori, out, res) => {
        if (res.text) {
            const data = `${ori.player ? ori.player.realName : ori.name} >> ${res.text}`;
            logger.warn(func.delStringCode(`[反馈] ${data}`));
            File.writeLine("./plugins/QYServer/Data/issues.txt", `[${system.getTimeStr()}] ${data}`);
            return out.success("反馈已提交！");
        }
        if (!ori.player) return out.error("控制台请带参数使用");
        const fm = mc.newCustomForm()
            .setTitle("反馈UI")
            .addInput("反馈内容");
        ori.player.sendForm(fm, (pl, data) => {
            if (!data) return;
            logger.warn(func.delStringCode(`[反馈] ${pl.realName} >> ${data}`));
            File.writeLine("./plugins/QYServer/Data/issues.txt", `[${system.getTimeStr()}] ${pl.realName} >> ${data}`);
            pl.tell("§a反馈已提交！");
        })
    })
    cmd.overload(['text']);
    cmd.setup();
})

// nodeui - 线路节点选择
mc.listen("onServerStarted", () => {
    const nodeuiCmd = mc.newCommand("nodeui", "§b线路节点选择", PermType.Any);
    nodeuiCmd.setAlias("server");
    nodeuiCmd.setCallback((_cmd, ori, out, _res) => {
        if (!ori.player) return out.success("过不去，怎么样都过不去>_<");
        const nodeList = config.nodeList;
        ori.player.sendSimpleForm("切换高速节点", "快来选择一个适合你的节点吧∽", nodeList.map(i => i.name), nodeList.map(i => i.ui), (pl, id) => {
            if (func.isNull(id)) return;
            if (nodeList.some(i => `${i.ip}:${i.port}` === pl.getDevice().serverAddress)) return pl.tell(`你目前正在使用 ${nodeList[id].name} 节点哦∽`);
            pl.transServer(nodeList[id].ip, nodeList[id].port) || pl.tell("过不去! 怎么样都过不去!>_<");
        })
    });
    nodeuiCmd.overload([]);
    nodeuiCmd.setup();
})

// tpserver - 传送到其他服
mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand("tpserver", "§b前往其他类型服", PermType.Any);
    cmd.setAlias("qyserver");
    cmd.setCallback((_cmd, ori, out, _res) => {
        if (!ori.player) return out.success("过不去，怎么样都过不去>_<")
        ori.player.sendSimpleForm("前往其他服", "生存玩腻了? 快来其他服玩玩吧∽", config.serverList.map(s => s.name), config.serverList.map(s => s.ui), (pl, id) => {
            if (func.isNull(id)) return;
            const server = config.serverList[id];
            if (!server.version.includes(Number(PAPI.getValueByPlayer("player_protocol_version", pl)))) return pl.tell(`协议版本不匹配!\n这个服支持的协议：[${server.version.join(",")}]`);
            if (!pl.transServer(server.ip, server.port)) return pl.tell("过不去! 怎么样都过不去!>_<");
            mc.broadcast(`[§dTPServer§r] >> ${pl.realName} 前往了${server.name}`);
            func.titleLog.info("TPServer", `${pl.realName} 前往了${func.delStringCode(server.name)}`);
        })
    });
    cmd.overload([]);
    cmd.setup();
})

// onmode - 触发一个功能性
mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand("onmode", "触发一个功能项", PermType.Any);
    cmd.setAlias("om");
    cmd.mandatory('text', ParamType.RawText);
    cmd.setCallback((_cmd, ori, out, res) => {
        if (res.text === "-outData") return out.success(`<Type：${ori.type}|Name：${ori.name}|Pos: ${ori.pos}>`);
        if (!ori.player) return out.error("玩家对象不存在");
        onmode(ori.player, res.text)// || out.error("命令对象未注册或没有执行权限");
    });
    cmd.overload(["text"]);
    cmd.setup();
})

// **** 高权限命令注册 **** //

mc.listen("onServerStarted", () => {
    const loggerCmd = mc.newCommand("logger", "向控制台输出一段日志", PermType.GameMasters);
    loggerCmd.mandatory('text', ParamType.RawText);
    loggerCmd.mandatory('mode', ParamType.Int);
    loggerCmd.overload(["mode", "text"]);
    loggerCmd.setCallback((_cmd, ori, out, res) => {
        const text = func.mcCode2Ansi(res.text);
        logger.setTitle("CmdLog");
        if (res.mode === 0) logger.info(text);
        if (res.mode === 1) logger.warn(text);
        if (res.mode === 2) logger.error(text);
        if (res.mode === 3) logger.debug(text);
        logger.setTitle("Server");
        out.success("向控制台发送信息 >> " + text);
    });
    loggerCmd.setup();
})

mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand("saydata", "脚本间数据通信", PermType.GameMasters);
    cmd.mandatory('key', ParamType.String);
    cmd.mandatory('data', ParamType.RawText);
    cmd.mandatory('mode', ParamType.Int);
    cmd.setCallback((_cmd, ori, out, res) => {
        const { data, mode, key } = res;
        if (key !== "saydata-0000-114514") return out.error("验证密钥错误");
        if (ori.type !== 14 && ori.type !== 7 && ori.type !== 0) logger.warn(`发现未知通信对象 <Type：${ori.type}|Name：${ori.name}>`);

        try {
            if (mode === 1) out.success(`${ll.eval(data.replace(/\${name}/g, ori.name))}`);
            if (mode === 2) File.writeTo("./getdata.txt", `${data}`);
        } catch (error) {
            logger.error(`脚本间通讯传输失败！模式：${{ 1: "运行JS字符串", 2: "写入临时文件", 3: "打印日志" }[mode] || mode} | ${error}`);
        }
    });
    cmd.overload(["key", "mode", "data"]);
    cmd.setup();
})

/**** 函数区 ****/

// 烟花发射UI
function firework(pl) {
    const AllFirework = [
        ...config.FireworkList.get("小型烟花"),
        //...config.FireworkList.get("中型烟花"),
        //...config.FireworkList.get("大型烟花"),
        //...config.FireworkList.get("特制烟花")
    ]

    const fm = mc.newCustomForm()
        .setTitle("发射一个烟火")
        .addLabel("在当前位置发射一个烟花\n§b烟花设计: 奈依rere\n§a(50蜡烛一次)§r")
        .addDropdown("选择类型", AllFirework)
        .addSwitch("扩散至周围", false)
    pl.sendForm(fm, (pl, data) => {
        if (func.isNull(data)) return pl.tell("表单已放弃")
        const money = mc.getScoreObjective("蜡烛")

        if (!(money.getScore(pl) >= 50)) return pl.tell("§c蜡烛不足!§r")

        func.enRuncmd(pl, `summon armor_stand "${AllFirework[data[1]]}"`)
        if (data[2]) func.enRuncmd(pl, `spreadplayers ~~ 5 20 @e[r=2.5,type=armor_stand,name="${AllFirework[data[1]]}"]`)

        money.reduceScore(pl, 50) && func.enRuncmd(pl, "playsound random.orb @s")
    })
}

// 个人信息显示
function playerInfo(player) {
    if (!player) return "找不到玩家 >_<";
    const d = player.getDevice();
    const info = [
        '-------------------------------',
        `名称: §a${player.realName}`,
        `XUID: §a${player.xuid}`,
        `UUID: §a${player.uuid}`,
        `聊天称号: §a${getChatTag(player)}`,
        `游戏模式: §a${['生存', '创造', '冒险', '', '', '', '旁观者'][player.gameMode] || '未知'}`,
        `游玩设备: §a${({ UWP: 'Windows', Android: '安卓' }[d.os] || d.os)}`,
        `网络延迟: §a${d.lastPing}ms`,
        `操作模式: §a${['', '键鼠', '触屏', '手柄', '运动控制器'][d.inputMode] || '未知'}`,
        '-------------------------------'
    ];

    return info.join('\n');
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
        pl.runcmd(`msg "${selectedPlayer.realName}" ${data[1]}`)
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
    fm.addSwitch("立刻生效", false)
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
        if (func.isNull(data)) return pl.tell("表单已放弃")
        crash(allPlayers[data[0]])
        pl.tell("崩溃请求已发送...")
    })
}

// 钢琴
function musicMenuUi(pl) {
    const fm = mc.newSimpleForm()
        .setTitle("钢琴")
        .setContent("qys:music_menu_ui")
    for (let i = 0; i < 15; i++) fm.addButton((i < 7 ? "白键" : "黑键"), "textures/blocks/noteblock")

    pl.sendForm(fm, (pl, id) => {
        if (func.isNull(id)) return
        id = Math.pow(2, (id - 9) / 12)
        func.enRuncmd(pl, `playsound note.harp @a[r=50] ~~~ 1 ${id} 1`)
        pl.tell(id + "")
        //for (let i = 0; i < 15; i++) 
        musicMenuUi(pl)
    })
}
/*function musicMenuUi(pl) {
    const fm = mc.newSimpleForm()
        .setTitle("琴")
        .setContent("qys:music_menu_ui")
    for (let i = 0; i < 15; i++) fm.addButton("看见我了说明你材质包坏啦！(｡･ω･｡)","textures/blocks/noteblock")
    pl.sendForm(fm,(pl,id,reason) => {
        if (id === null) return
        id = (id * 0.1) + 0.2
        func.enRuncmd(pl, `playsound note.harp @a[r=50] ~~~ 10 ${id} 10`)
        //pl.tell(""+id)
        for (let i = 0; i < 5; i++) musicMenuUi(pl)
    })
}*/


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
    pl.tell("经验修补中，当前物品耐久: " + (item?.maxDamage - item?.damage), 5)
    pl.refreshItems();
}

// 新手加入
function newPlayerUi(pl) {
    if (!pl.hasTag("player")) {
        func.enRuncmd(pl, "structure load 新手装备 ~~~")
        logger.warn(`${pl.realName} 首次加入服务器`)
        pl.addTag("player")
    }
    pl.closeForm()
    mc.runcmdEx(`camera "${pl.realName}" set minecraft:free pos -77 66 35 facing -75 0 35`)
    mc.runcmdEx(`hud "${pl.realName}" hide all`)
    pl.tell("", 5)
    pl.sendModalForm("欢迎", "你是第一次来到《光遇》的世界吗？", " 是", " 否", (pl, id) => {
        if (!id) {
            mc.runcmdEx(`hud "${pl.realName}" reset`)
            mc.runcmdEx(`camera "${pl.realName}" clear`)
            return
        }
        mc.runcmdEx(`camera "${pl.realName}" set minecraft:free ease 7.5 linear pos 36.5 67.5 33.5 rot 0 -90`)
        pl.setTitle("screen.sky")
        pl.setTitle("(如果你看到了这段话，就说明你材质包没下完，快去下！)", 3)
        //pl.setTitle("§l光·遇",2)
        //pl.setTitle("§l§b光是遇见 §a就很美好§r\n§7=== §r§l欢迎来到 §bQ§aY§eServer§r §7===",3)
        pl.tell("新手指引加载中...", 5)
        setTimeout(() => helpAnimated(pl), 5500)
    })
}

// 新手指引
function helpAnimated(pl, mode = 0) {
    pl.closeForm()
    if (mode === -1) {
        pl.tell("找不到上一个！怎么找也找不到！>_<")
        helpAnimated(pl, 0)
        return
    }
    switch (mode) {
        case 0:
            mc.runcmdEx(`camera "${pl.realName}" set minecraft:free ease 0.75 linear pos 48 66 34 facing @e[type=armor_stand,name=回溯神坛,c=1]`)
            pl.sendModalForm(
                "回溯神坛", "当你在冒险中§b意外重生§r，便可用§6回溯神坛§r快速§l返回死亡点§r",
                "上一个", "下一个", (pl, id) => helpAnimated(pl, (id ? mode - 1 : mode + 1))
            )
            return
        case 1:
            mc.runcmdEx(`camera "${pl.realName}" set minecraft:free ease 0.75 linear pos 51 64 33 facing 53 63 32`)
            pl.sendModalForm(
                "石像神龛", "可以在这里接取§6每日任务§r，完成后会获得§b丰厚奖励§r！",
                "上一个", "下一个", (pl, id) => helpAnimated(pl, (id ? mode - 1 : mode + 1))
            )
            return
        case 2:
            mc.runcmdEx(`camera "${pl.realName}" set minecraft:free ease 1.5 linear pos 19 67 -7 facing 26 65 -9`)
            pl.sendModalForm(
                "小船商店", "你可以在这里购买一些§6实用的魔法或物品§r",
                "上一个", "下一个", (pl, id) => helpAnimated(pl, (id ? mode - 1 : mode + 1))
            )
            return
        case 3:
            mc.runcmdEx(`camera "${pl.realName}" set minecraft:free ease 1.5 linear pos 46 66 17 facing 48 63 9`)
            pl.sendModalForm(
                "晨岛", "进入这个§6传送门§r，立刻§a开始生存§r吧！",
                "上一个", "下一个", (pl, id) => helpAnimated(pl, (id ? mode - 1 : mode + 1))
            )
            return
        case 4:
            mc.runcmdEx(`camera "${pl.realName}" clear`)
            mc.runcmdEx(`hud "${pl.realName}" reset`)
            pl.setTitle("§a新手引导完毕§r", 2)
            pl.setTitle("§b出发吧!§e 将光传递下去！", 3)
            meSetUI(pl)
            return
    }
}

// 个人设置
function meSetUI(pl) {
    const fm = mc.newCustomForm().setTitle("个人设置")
    config.meSetList.forEach(item => fm.addSwitch(item.name, !pl.hasTag(item.tag)))
    pl.sendForm(fm, (pl, data) => {
        if (func.isNull(data)) return
        config.meSetList.forEach((item, index) => {
            data[index] ? pl.removeTag(item.tag) : pl.addTag(item.tag)
            // pl.tell(`${pl.realName} ${data[index] ? "remove tag: " : "add tag: "}${item.tag}`)
        })
    })
}

// 触发一个功能项
let pngMap = null;
const playerCmd = {// 玩家可以用
    xpfix: (player) => xpFix(player),
    meSet: (player) => meSetUI(player),
    firework: (player) => firework(player),
    new: (player) => player.pos.dimid !== 0 ? player.tell("哪有在其他维度开新手指南啊喂") : newPlayerUi(player),
    giveskin: (player) => mc.runcmdEx(`sendshowstoreoffer "${player.realName}" character 927cab07-ab94-44d4-8581-b2a5342b07b4`),
    rc: (player) => player.refreshChunks() ? player.tell("§a区块刷新请求已发送至客户端进行处理") : player.tell("§c无法创建请求"),

    crash: (player) => {
        let crashtime = [5, 4, 3, 2, 1]
        crashtime.forEach((sec, index) => {
            setTimeout(() => {
                player.tell(`§c祂即将降临！剩余 ${sec} 秒`);
                if (sec === 1) crash(player)
            }, (index + 1) * 1000);
        })
    },

    book: (player) => {
        const fm = mc.newCustomForm()
            .setTitle("小说阅读器")
            .addInput("小说名", "在这里填写你想要搜索的小说名");
        player.sendForm(fm, (pl, data) => {
            if (data === null) pl.tell("表单已放弃");
            else getBook(data, pl);
        });
    },

    killme: (player) => {
        player.teleport(player.getRespawnPosition() ?? new IntPos(39, 65, 32, 0));
        mc.runcmdEx(`effect "${player.realName}" clear`);
        mc.runcmdEx(`effect "${player.realName}" instant_health 1 255`);
        mc.runcmdEx(`effect "${player.realName}" saturation 1 255`);
    }
};

const opCmd = { // OP 可以用
    tpch: (player, command) => player.runcmd(`tp @s ${command[1] * 16 + 8} ~ ${command[2] * 16 + 8}`),
    getNbt: (player) => File.writeTo("./plugins/QYServer/nbt.txt", JSON.stringify(player.getHand().getNbt().toSNBT())),

    setNbt: (player) => {
        if (!player?.getHand()?.isNull()) return player.tell("吧唧吧唧，我要吃空气！");
        //log(JSON.parse(File.readFrom("./plugins/QYServer/nbt.txt")));
        const itemNbt = mc.newItem(NBT.parseSNBT(JSON.parse(File.readFrom("./plugins/QYServer/nbt.txt"))));
        player.getHand().set(itemNbt);
        player.refreshItems();
    },

    getbin: (player, _command, pngMap) => {
        if (pngMap === null) system.cmd(`cd . && ".\\bin\\img2bin.exe" -in 1.png -out 1`, (exitcode, output) => {
            player.tell("ExitCode : " + exitcode);
            player.tell(output);
            player.tell("地图画转化bin完成");
            pngMap = 0;
        });
        if (pngMap === null) return player.tell("地图画转化bin失败");

        let binMapList = File.getFilesList("./bin").filter(item => !item.endsWith(".png") && !item.endsWith(".exe"));
        if (pngMap < binMapList.length) {
            player.runcmd(`map "bin/${binMapList[pngMap]}"`);
            player.tell(`生成地图画 ${pngMap + 1}/${binMapList.length}: ${binMapList[pngMap]}`);
            pngMap++;
        } else {
            player.tell("所有地图画已生成完毕");
            pngMap = null;
        };
    }
};
function onmode(player, cmd) {
    const command = cmd.split(" "); // 提取主命令

    return (() => {
        if (playerCmd[command[0]]) return playerCmd[command[0]](player, command);
        else if ((player.isOP() || player.hasTag("op")) && opCmd[command[0]]) return opCmd[command[0]](player, command, pngMap);
        else return false;
    })();
}
