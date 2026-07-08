// import dts
/// <reference path="/root/VSCode/Library/ImportAll.d.ts"/>

import { Recipes } from '../../GMLIB-LegacyRemoteCallApi/lib/GMLIB_API-JS.js';
import { PAPI } from '../../GMLIB-LegacyRemoteCallApi/lib/BEPlaceholderAPI-JS.js';
import * as il from "../../iListenAttentively-LseExport/lib/iListenAttentively.js";

import { config } from "../Config/config.js";
import * as events from "./lib/events.js";
import * as func from "./lib/func.js";
logger.setTitle("Server");

// 初始化变量
let is_reload = (mc.getOnlinePlayers().length != 0);

PAPI.registerPlayerPlaceholder(func.getChatTag, "QYServer", "player_chatTag"); // 注册PAPI
mc.listen("onEndermanTakeBlock", () => false); // 防搬方块
mc.listen("onWitherBossDestroy", () => false); // 凋零防爆
mc.listen("onRespawnAnchorExplode", (pos, player) => {// 重生毛爆炸
    if (pos.dimid === 0) {
        player.tell("不要在主世界使用重生猫啊喂！");
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
    il.emplaceListener("lac::punish::PlayerCheatEvent", (i) => i.self.toPlayer().tell("§e注意！您已被反作弊娘注视！")); // 监听反作弊

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

    // 注册切石机合成表
    Recipes.registerStoneCutterRecipe("qys:amethyst", "amethyst_block", 0, "amethyst_shard", 0, 4); // 紫水晶
})

// 玩家连接世界
mc.listen("onPreJoin", () => {
    if (is_reload) return;
    mc.runcmdEx("playsound custom.online_sound @a");
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

// 玩家破坏方块完成
mc.listen("onDestroyBlock", (player, block) => {
    if (block.type === "minecraft:budding_amethyst"
        && func.probability(50)
    ) mc.spawnItem(mc.newItem("minecraft:budding_amethyst", 1), block.pos);

    if ((block.type === "minecraft:trial_spawner" || block.type === "minecraft:mob_spawner")
        && block.hasBlockEntity()
    ) {
        const eggType = block.getBlockEntity()?.getNbt()?.getData("EntityIdentifier");
        if (eggType) mc.spawnItem(mc.newItem(`${eggType}_spawn_egg`, 1).setLore(["* 刷怪笼掉落物品"]), block.pos);
    }
})

// 生物骑乘
mc.listen("onRide", (rider, mount) => {
    if (mount.type === "minecraft:ender_dragon"
        && !rider.hasTag("qys:ride_ender_dragon")
    ) return false;
})

// 活塞尝试推动
mc.listen("onPistonTryPush", (_pos, block) => {
    if (block.type.includes("shulker_box")) return false;
})

// 后台执行命令
mc.listen("onConsoleCmd", (cmd) => {
    if (cmd === "") return false;
    const args = cmd.split(" ");

    switch (cmd) {
        case "reload":
            setTimeout(() => mc.runcmd("scriptevent qys:command noChat true"), 2000);
            return;
        case "testfor":
            mc.getOnlinePlayers().forEach(player => log(`${player.realName} -> ${func.enRuncmd(player, "testfor @e[r=160]").output?.split(", ")?.length}`));
            return false;
        case "tps":
            logger.info(mc.runcmdEx("cleaner tps").output);
            return false;
        case "mspt":
            logger.info(mc.runcmdEx("cleaner mspt").output);
            return false;
        case "list -v":
            mc.getOnlinePlayers().forEach(player => logger.info(PAPI.translateString("%player_realname% version %player_client_version%", player)));
            return false;
        case "list -i":
            mc.getOnlinePlayers().forEach(player => {
                const dev = player.getDevice();
                logger.info(func.mcCode2Ansi(`${player.realName} §a-ping §l${dev.avgPing}ms§r §b-os §l${dev.os}§r §e-ip §l${dev.ip}§r §d-clientId §l${dev.clientId}§r`));
            })
            return false;
    };

    switch (args[0]) {
        case "say":
            ll.imports("BehaviorLog_WriteLog")("后台喊话", "Server", "服务器娘", "", "", "", "", "", "", "", `${cmd}`, false, true);
            return;
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
        case player.hasTag("qys:beforeSkin_3"):
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
            if (!player.isOP()) return;
            setTimeout(() => mc.runcmd("scriptevent qys:command noChat true"), 2000);
            return;
        case "msg":
            msgUI(player);
            return false;
        case "testfor":
            player.tell("==============");
            player.tell(`所有实体数: ${mc.runcmdEx("testfor @e").output.split(", ").length}`);
            player.tell("玩家240格附近实体数：");
            mc.getOnlinePlayers().forEach(player => player.tell(`${player.realName} -> ${func.enRuncmd(player, "testfor @e[r=240]").output?.split(", ")?.length}`));
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
            player.sendModalForm("留言纸船", "是否删除这条留言？这将无法恢复！", "§c立刻删除§r", "§a我再想想§r", (player, ui) => {
                if (ui) entity.despawn();
            })
        }
    }
})

// 漏斗传输物品
mc.listen("onHopperPushOut", (_pos, isMinecart, item) => {
    if (isMinecart) return;
    if (item.type.includes("bundle")) return false;
})

// 玩家尝试放置方块
mc.listen("onPlaceBlock", (player, block) => {
    if (!player.isOP()
        && ((config.banBlock.has(block.type)
            || (
                block.type.startsWith("minecraft:element_") && /^\d+$/.test(block.type.slice(18))
            )
        ))) {
        player.tell("§c您需要创造模式 + 操作员权限来放置此方块§r");
        player.refreshChunks();
        return false;
    }
})

// 玩家对方块使用物品
mc.listen("onUseItemOn", (player, item, block, side, pos) => {
    // 颜料给方块染色
    // minecraft:black_dye -> minecraft:black_wool
    if (item.type.match(/_dye$/) && player.isSneaking) {
        let blockType = block.type.match(config.colorBlock);
        if (!blockType) return;

        blockType = `${item.type.slice(0, -4)}_${blockType[1]}`;
        block.setNbt((block.getNbt().setString("name", blockType)));

        player.clearItem(item.type, 1);
        player.refreshItems();
    }

    // 阻止修改刷怪笼
    if (item.type.match("spawn_egg") && player.gameMode != 1) {
        if (block.type === "minecraft:trial_spawner"
            || block.type === "minecraft:mob_spawner"
        ) return false;
    }

    // 放置相机时减少物品
    if (item.type === "minecraft:camera" && side === 1) {
        setTimeout(() => mc.runcmdEx(`clear "${player.realName}" camera 1 1`), 100);
        return;
    }

    // 下界放水
    if (player.pos.dimid === 1
        && item.type === "minecraft:water_bucket"
        && func.LandJudgment(player, pos)
        && mc.getBlock(pos)?.type === "minecraft:air"
    ) mc.setBlock(pos, "minecraft:flowing_water", 0);
})

// 玩家使用物品
mc.listen("onUseItem", (player, item) => {
    if (item.type === "qys:wing") {
        if (player.maxHealth === 60) return player.tell("[§aTip§r] 您的光翼已达上限(" + player.maxHealth + "/60)");
        player.setMaxHealth(player.maxHealth + 1);
        player.tell("" + func.enRuncmd(player, "playsound random.orb @s").output);
        return player.clearItem("qys:wing", 1);
    }
    if (item.type === "qys:magic") return func.enRuncmd(player, "playsound custom.magic_use_sound @a[r=10] ~~~");
    if (player.isSneaking
        && !item?.isNull()
        && item.damage !== 0
        && player.getTotalExperience() > 20
    ) return xpFix(player);
})

// 生物死亡事件
mc.listen("onMobDie", (mob, source) => {
    if (!mob || !source) return;
    if (source.type !== "minecraft:player") return;
    if (func.probability(15)) mc.spawnItem(mc.newItem("qys:candle_white", 1), mob.pos);
    if (mob?.type !== "spark:hoglin_remains") func.enRuncmd(source.toPlayer(), "function function/killEntity");
})

// 玩家重生事件
mc.listen("onRespawn", (player) => {
    if (player.maxHealth > 20) {
        player.setMaxHealth(player.maxHealth - 1); // 扣一颗心
        mc.runcmdEx(`playsound custom.Injured_sound "${player.realName}"`);
    } else {
        player.setMaxHealth(20); // 心小于20时设置成20
    }
});

// 玩家交互实体
mc.listen("onPlayerInteractEntity", (player, entity) => {
    if (player.hasTag("qys:touch")) func.enRuncmd(entity, "function function/pat");

    if (entity.type === "qys:message") {
        entityMessageUI(player, entity);
        return;
    }

    if (entity.type.includes("qys:firework_") && !entity.hasTag("qys:firework_open")) {
        if (player.getHand().type !== "minecraft:flint_and_steel") return player.tell("需要用打火机点燃这个烟花!", 5);
        entity.addTag("qys:firework_open");
        entity.addEffect(24, 114514, 20, false);
        func.enRuncmd(entity, "scoreboard players random @s fireworks_time 20 30");
        func.enRuncmd(entity, "playsound custom.firework_front @a[r=13] ~~~");
        return;
    }
})

const onUseItemOnCd = new Set();

// 下界反应堆逻辑
mc.listen("onUseItemOn", (player, _item, block) => {
    if (!(!player.isSneaking
        && !onUseItemOnCd.has(player.xuid)
        && player.pos.dimid === 0
        && block.type === "minecraft:netherreactor"
    )) return;
    onUseItemOnCd.add(player.xuid) && setTimeout(() => onUseItemOnCd.delete(player.xuid), 100);
    mc.runcmdEx(`
        execute positioned ${block.pos.x} ${block.pos.y} ${block.pos.z}
            if block ~ ~-1 ~ cobblestone
            if block ~ ~-1 ~1 cobblestone
            if block ~ ~-1 ~-1 cobblestone
            if block ~1 ~-1 ~ cobblestone
            if block ~-1 ~-1 ~ cobblestone
            if block ~1 ~-1 ~1 gold_block
            if block ~1 ~-1 ~-1 gold_block
            if block ~-1 ~-1 ~1 gold_block
            if block ~-1 ~-1 ~-1 gold_block

            if block ~1 ~ ~1 cobblestone
            if block ~1 ~ ~-1 cobblestone
            if block ~-1 ~ ~1 cobblestone
            if block ~-1 ~ ~-1 cobblestone

            if block ~ ~1 ~ cobblestone
            if block ~1 ~1 ~ cobblestone
            if block ~-1 ~1 ~ cobblestone
            if block ~ ~1 ~-1 cobblestone
            if block ~ ~1 ~1 cobblestone
        run structure load mystructure:下界反应建筑 ~-7 ~-2 ~-7 0_degrees none block_by_block 10 false
    `)
})

// 玩家坐在椅子上逻辑
mc.listen("onUseItemOn", (player, item, block) => {
    if ((!player.hasTag("qys:free_noclip") && block.type.search(/_(stairs|slab)/) === -1)
        || !item.isNull()
        || player.hasTag("qys:no_sitdown")
        || player.isSneaking
        || onUseItemOnCd.has(player.xuid)
        || block?.getNbt()?.getTag("states")?.getData("upside_down_bit") // 楼梯使用
        || block?.getNbt()?.getTag("states")?.getData("minecraft:vertical_half") == "top" // 半砖使用
        || mc.getEntities(block.pos, 0.25).some(e => e.type === "qys:ride")
    ) return;
    onUseItemOnCd.add(player.xuid) && setTimeout(() => onUseItemOnCd.delete(player.xuid), 40);

    const rotate = { 0: 90, 1: -90, 2: 180, 3: 0 }[block?.getNbt()?.getTag("states")?.getData("weirdo_direction")] || 0;
    mc.runcmdEx(`execute at "${player.realName}" as @e[type=qys:ride,rm=0.01,name="qys:rideing_${player.realName}"] run cleaner despawn @s`);
    mc.runcmdEx(`execute at "${player.realName}" run summon qys:ride "qys:rideing_${player.realName}" ${block.pos.x} ${block.pos.y} ${block.pos.z}`);
    mc.runcmdEx(`execute as @e[type=qys:ride,name="qys:rideing_${player.realName}"] at @s run tp ~~~ ${rotate}`);
    mc.runcmdEx(`tag @e[type=qys:ride,name="qys:rideing_${player.realName}"] add qys:ride_player`);
    setTimeout(() => mc.runcmdEx(`execute as "${player.realName}" at @s run ride @s start_riding @e[type=qys:ride,rm=0.0001,name="qys:rideing_${player.realName}"]`), 2);
})

// **** 循环计时器区 **** //
mc.listen('onServerStarted', () => {
    // if (is_reload) return;
    const ms = mc.getScoreObjective("ms");
    let ping = 255;

    // 玩家延迟显示
    setInterval(() => {
        mc.getOnlinePlayers().forEach((player) => {
            if (player.hasTag("qys:in:afk")) return;
            ms.setScore(player,
                (player.getDevice()?.avgPing ?? 327679280)
            );
        })
    }, 2 * 1000)

    // 一言
    setInterval(() => {
        const text = config.wordList[Math.floor(Math.random() * config.wordList.length)];
        mc.getOnlinePlayers().forEach((player) => {
            if (!player.hasTag("qys:no_word")) player.tell(`${text}`, 5);
        });
    }, config.wordtime * 60 * 1000);

    // 假死检查
    // setInterval(() => File.writeTo("./in_run.bin", "" + Date.now()), 5 * 60 * 1000)
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
        if (!ori.player) return;
        const player = ori.player;
        const tagList = player.getAllTags().filter(item => item.startsWith("tag:"));//tagList.unshift("tag:§e萌§a新§b求§d带§r");
        if (tagList.length === 0) return out.success("[§e称号系统§r] >> 未找到可佩戴的称号");
        if (player.hasTag("qys.tag:unset")) return out.success("[§e称号系统§r] >> §c当前称号无法更改");

        const fm = mc.newCustomForm()
            .setTitle("称号设置")
            .addDropdown("选择一个要佩戴的称号\n已佩戴称号: " + func.getChatTag(ori.player), tagList);
        player.sendForm(fm, (player, data) => {
            if (func.isNull(data)) return;
            mc.runcmdEx(`tag "${player.realName}" add "usf.${tagList[data]}"`);
            func.enRuncmd(player, "playsound random.levelup @s ~~~ 10 2");
            setTimeout(() => player.tell("[§e称号系统§r] >> §a佩戴成功, 已佩戴称号§r: " + tagList[data].replace(/^tag:/, "")), 20);
        });
    })
    cmd.overload([]);
    cmd.setup();
})

// offhand - 主副手切换
mc.listen('onServerStarted', () => {
    const cmd = mc.newCommand('offhand', '§a主副手切换', PermType.Any);
    cmd.setCallback((_cmd, ori, out, _res) => {
        if (!ori.player) return;
        const player = ori.player;
        if (player.getHand()?.getNbt()?.getTag("tag")?.getData("PickUp")) return out.error("请放下搬运物再使用吧");
        const itemBak = player.getHand().clone();
        player.getHand().set(player.getOffHand());
        player.getOffHand().set(itemBak);
        player.refreshItems();
        player.tell("§a已交换手部物品\n您可能需要切换快捷栏来刷新物品", 3);
    });
    cmd.overload([]);
    cmd.setup();
})

// helmet - 头部盔甲互换
mc.listen('onServerStarted', () => {
    const cmd = mc.newCommand('helmet', '§a头部盔甲切换', PermType.Any);
    cmd.setCallback((_cmd, ori, out, _res) => {
        if (!ori.player) return;
        const player = ori.player;
        if (player.getHand()?.getNbt()?.getTag("tag")?.getData("PickUp")) return out.error("请放下搬运物再使用吧");
        const itemBak = player.getHand().clone();
        player.getHand().set(player.getArmor().getItem(0));
        player.getArmor().getItem(0).set(itemBak);
        player.refreshItems();
        player.tell("§a已交换头盔与主手物品\n§a您可能需要切换快捷栏来刷新物品", 3);
    });
    cmd.overload([]);
    cmd.setup();
})

// nodeui - 线路节点选择
mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand("nodeui", "§b线路节点选择", PermType.Any);
    cmd.setAlias("server");
    cmd.setCallback((_cmd, ori, out, _res) => {
        if (!ori.player) return out.success("过不去，怎么样都过不去>_<");
        const nodeList = config.nodeList;
        ori.player.sendSimpleForm("切换高速节点", "快来选择一个适合你的节点吧∽",
            nodeList.map(i => i.name),
            nodeList.map(i => i.ui),
            (player, id) => {
                if (func.isNull(id)) return;
                if (nodeList.some(i => `${i.ip}:${i.port}` === player.getDevice().serverAddress)) return player.tell(`你目前正在使用 ${nodeList[id].name} 节点哦∽`);
                player.transServer(nodeList[id].ip, nodeList[id].port) || player.tell("过不去! 怎么样都过不去!>_<");
            })
    });
    cmd.overload([]);
    cmd.setup();
})

// tpserver - 传送到其他服
mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand("tpserver", "§b前往其他类型服", PermType.Any);
    cmd.setAlias("qyserver");
    cmd.setCallback((_cmd, ori, out, _res) => {
        if (!ori.player) return out.success("过不去，怎么样都过不去>_<")
        ori.player.sendSimpleForm("前往其他服", "生存玩腻了? 快来其他服玩玩吧∽",
            config.serverList.map(s => s.name),
            config.serverList.map(s => s.ui),
            (player, id) => {
                if (func.isNull(id)) return;
                const server = config.serverList[id];
                if (!server.version.includes(Number(PAPI.getValueByPlayer("player_protocol_version", player)))) return player.tell(`协议版本不匹配!\n这个服支持的协议：[${server.version.join(",")}]`);
                if (!player.transServer(server.ip, server.port)) return player.tell("过不去! 怎么样都过不去!>_<");
                mc.broadcast(`[§dTPServer§r] >> ${player.realName} 前往了${server.name}`);
                func.titleLog.info("TPServer", `${player.realName} 前往了${func.delStringCode(server.name)}`);
            })
    });
    cmd.overload([]);
    cmd.setup();
})

// scale - 自定义大小
mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand("scale", "§b自定义大小", PermType.Any);
    cmd.optional('Int', ParamType.Int, 1);
    cmd.setCallback((_cmd, ori, out, res) => {
        const player = ori.player;
        if (!player) return;
        if (!res.Int) {
            player.setScale(1);
            return out.success("大小已恢复为默认值");
        }
        if (res.Int > 35) return out.success("最大不能超过35!");
        if (res.Int < 1) return out.success("最小不能低于1!");
        player.setScale(res.Int);
        out.success(`大小已修改为${res.Int}倍！`);
    });
    cmd.overload(['Int']);
    cmd.setup();
})

// issues - 反馈问题
mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand("issues", "§b反馈问题", PermType.Any);
    cmd.optional('text', ParamType.RawText);
    cmd.setCallback((_cmd, ori, out, res) => {
        if (!res.text && !ori.player) return out.error("请输入文本！");
        if (res.text) {
            const data = `[${system.getTimeStr()}] ${ori?.player?.realName || ori?.name} >> ${res?.text}`;
            func.titleLog.warn("QYIssues", data);
            File.writeLine("./plugins/QYServer/Data/issues.txt", data);
            out.success("反馈已提交！");
            func.sendMail({
                from: '"issues" <admin@m.qyserver.cc>',
                to: ["Ice_rink@qyserver.cc", "qy@qyserver.cc"],
                subject: "QYServer | 收到反馈",
                text: `反馈原始信息:\n${data}`
            }, (info, isSend) => {
                isSend
                    ? func.titleLog.warn("QYEmail", "反馈邮件已发送！")
                    : func.titleLog.warn("QYEmail", info)
            })
        } else {
            const fm = mc.newCustomForm()
                .setTitle("反馈UI")
                .addInput("反馈内容");
            ori.player.sendForm(fm, (player, data) => {
                if (!data) return;
                player.runcmd(`/issues ${data}`);
            })
        }
    })
    cmd.overload(['text']);
    cmd.setup();
})

// onmode - 触发一个功能项
mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand("onmode", "触发一个功能项", PermType.Any);
    cmd.setAlias("om");
    cmd.mandatory('text', ParamType.RawText);
    cmd.setCallback((_cmd, ori, out, res) => {
        if (res.text === "-outData") return out.success(`<Type：${ori.type}|Name：${ori.name}|Pos: ${ori.pos}>`);
        if (ori.player) onmode(ori.player, res.text) ?? out.error("命令对象未注册或没有执行权限");
        else onmodeConsole(ori, out, res.text);
    });
    cmd.overload(["text"]);
    cmd.setup();
})

// **** 高权限命令注册 **** //

mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand("logger", "向控制台输出一段日志", PermType.GameMasters);
    cmd.mandatory('text', ParamType.RawText);
    cmd.mandatory('mode', ParamType.Int);
    cmd.setCallback((_cmd, _ori, out, res) => {
        const text = func.mcCode2Ansi(res.text);
        logger.setTitle("CmdLog");
        switch (res.mode) {
            case 0: logger.info(text); break;
            case 1: logger.warn(text); break;
            case 2: logger.error(text); break;
            case 3: logger.debug(text); break;
        };
        logger.setTitle("Server");
        out.success("向控制台发送信息 >> " + text);
    });
    cmd.overload(["mode", "text"]);
    cmd.setup();
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
            logger.error(`脚本间通讯传输失败！模式：${{ 1: "运行JS字符串", 2: "写入临时文件" }[mode] || mode} | ${error}`);
        }
    });
    cmd.overload(["key", "mode", "data"]);
    cmd.setup();
})

/**** 函数区 ****/

// 烟花发射UI
function firework(player) {
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
        .addSwitch("扩散至周围", false);

    player.sendForm(fm, (player, data) => {
        if (func.isNull(data)) return player.tell("表单已放弃");
        const money = mc.getScoreObjective("蜡烛");
        if (!(money.getScore(player) >= 50)) return player.tell("§c蜡烛不足!§r");
        func.enRuncmd(player, `summon armor_stand "${AllFirework[data[1]]}"`);
        if (data[2]) func.enRuncmd(player, `spreadplayers ~~ 5 20 @e[r=2.5,type=armor_stand,name="${AllFirework[data[1]]}"]`);
        money.reduceScore(player, 50) && func.enRuncmd(player, "playsound random.orb @s");
    })
}

// 打开实体评论区
function entityMessageUI(player, entity) {
    const msgList = func.tagData(entity, "get", "messages") || ["§7这里很安静...\n快来留下你的第1句话吧~"];
    const fm = mc.newCustomForm()
        .setTitle("留言")
        .addLabel(msgList.join("\n"))
        .addDivider()
        .addInput("发送一段留言", "在这里写下你想留言的话吧~");

    player.sendForm(fm, (player, data) => {
        if (func.isNull(data)) return;

        func.tagData(
            entity, "add", "messages",
            `[${func.getChatTag(player)}]${player.realName} >> ${data[2]}`
        );
        entityMessageUI(player, entity);
    });
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
function msgUI(player, swi = false, oldPlayer = player.realName) {
    const allPlayers = mc.getOnlinePlayers();
    const oldIndex = allPlayers.findIndex(p => p.realName === oldPlayer);
    oldPlayer = (oldIndex === -1) ? 0 : oldIndex;

    const fm = mc.newCustomForm()
        .setTitle("私聊快捷菜单")
        .addDropdown("选择要发送信息的玩家", (allPlayers.map(player => "私聊-" + player.realName)), oldPlayer)
        .addInput("私聊信息")
        .addSwitch("发送后再次打开表单", swi);
    player.sendForm(fm, (player, data) => {
        if (func.isNull(data)) return player.tell("表单已放弃");
        const sendPlayer = allPlayers[data[0]];
        player.runcmd(`msg "${sendPlayer.realName}" ${data[1]}`);
        if (data[2]) msgUI(player, data[2], sendPlayer.realName);
    });
}

// 钢琴
function musicMenu(player, modeIndex = 0, pitche = "note.harp") {
    const mode = ([15, 21][modeIndex]);
    const fm = mc.newSimpleForm()
        .setTitle("钢琴")
        .setContent("qys:music_menu_ui");
    for (let i = 0; i < mode; i++) fm.addButton("看见我了说明你材质包坏啦！(｡･ω･｡)", "textures/blocks/noteblock");

    player.sendForm(fm, (player, id, rea) => {
        // if (!rea) return player.closeForm();
        if (func.isNull(id)) return;

        func.enRuncmd(player, `playsound ${pitche} @a[r=50] ~~~ 5 ${func.pitchList[mode][id]} 2.5`);
        for (let i = 0; i < 10; i++) musicMenu(player, modeIndex, pitche);
    })
}


// 经验修补
function xpFix(player) {
    const item = player.getHand(); // fix高版本lse出现的神奇bug

    const enchants = item.getNbt()?.getTag("tag")?.getTag("ench")?.toArray();
    if (!enchants?.some(e => e.id === 26)) return;
    const unbreakingLevel = enchants?.find(e => e.id === 17)?.lvl || 0;

    // 有耐久附魔时有概率不消耗经验
    if (!(unbreakingLevel > 0 && Math.random() < unbreakingLevel * 0.2))
        player.reduceExperience(1)
    item.setDamage(Math.max(0, item.damage - 10));

    player.tell("经验修补中，当前物品耐久: " + (item.maxDamage - item.damage), 5)
    player.refreshItems();
}

// 新手加入
function newPlayerUi(player) {
    if (!player.hasTag("player")) {
        func.enRuncmd(player, "structure load 新手装备 ~~~")
        logger.warn(`${player.realName} 首次加入服务器`)
        player.addTag("player")
    }
    player.closeForm()
    mc.runcmdEx(`camera "${player.realName}" set minecraft:free pos -77 66 35 facing -75 0 35`)
    mc.runcmdEx(`hud "${player.realName}" hide all`)
    player.tell("", 5)
    player.sendModalForm("欢迎", "你是第一次来到《光遇》的世界吗？", " 是", " 否", (player, id) => {
        mc.runcmdEx(`camera "${player.realName}" set minecraft:free ease 7.5 linear pos 36.5 67.5 33.5 rot 0 -90`);
        player.setTitle("screen.sky");
        player.setTitle("(如果你看到了这段话，就说明你材质包没下完，快去下！)", 3);
        //player.setTitle("§l光·遇",2)
        //player.setTitle("§l§b光是遇见 §a就很美好§r\n§7=== §r§l欢迎来到 §bQ§aY§eServer§r §7===",3)
        meSetUI(player);
        setTimeout(() => {
            mc.runcmdEx(`camera "${player.realName}" clear`);
            mc.runcmdEx(`hud "${player.realName}" reset`);
        }, 7000);
    })
}

// 个人设置
function meSetUI(player) {
    const fm = mc.newCustomForm().setTitle("个人设置");
    config.meSetList.forEach(item => fm.addSwitch(item.name, !player.hasTag(item.tag)));
    player.sendForm(fm, (player, data) => {
        if (func.isNull(data)) return;
        config.meSetList.forEach((item, index) => {
            data[index] ? player.removeTag(item.tag) : player.addTag(item.tag);
            // player.tell(`${player.realName} ${data[index] ? "remove tag: " : "add tag: "}${item.tag}`);
        });
    })
}

// 触发一个功能项
let pngMap = null;
export const omExpList = [];
const playerCmd = {// 玩家可以用
    help: (player) => player.tell(
        "可用参数："
        + `\n${[...Object.keys(playerCmd), ...omExpList].join(", ")}`
        + `\n${(player.hasTag("op") || player.isOP()) ? (Object.keys(opCmd)).join(", ") : ""}`
    ),
    xpfix: (player) => xpFix(player),
    meSet: (player) => meSetUI(player),
    firework: (player) => firework(player),
    musicMenu: (player) => musicMenu(player),
    new: (player) => player.pos.dimid !== 0 ? player.tell("哪有在其他维度开新手指南啊喂！") : newPlayerUi(player),
    giveskin: (player) => mc.runcmdEx(`sendshowstoreoffer "${player.realName}" character 927cab07-ab94-44d4-8581-b2a5342b07b4`),
    rc: (player) => player.refreshChunks() ? player.tell("§a区块刷新请求已发送至客户端进行处理") : player.tell("§c无法创建请求"),

    updata: (player) => {
        const fm = mc.newSimpleForm()
            .setTitle("更新日志")
            .setContent(config.updataLog);

        player.sendForm(fm, (() => { }));
    },

    crash: (player) => {
        let crashtime = [5, 4, 3, 2, 1]
        crashtime.forEach((sec, index) => {
            setTimeout(() => {
                player.tell("§c祂即将降临！");
                if (sec === 1) func.crash(player)
            }, (index + 1) * 1000);
        })
    },

    killme: (player) => {
        player.teleport(player.getRespawnPosition() ?? new IntPos(39, 65, 32, 0));
        mc.runcmdEx(`effect "${player.realName}" clear`);
        mc.runcmdEx(`effect "${player.realName}" instant_health 1 255`);
        mc.runcmdEx(`effect "${player.realName}" saturation 1 255`);
    }
};

const elytraItemList = {
    textures: [
        "textures/items/dye_powder_black_new",
        "textures/items/dye_powder_blue_new",
        "textures/items/dye_powder_light_blue",
        "textures/items/dye_powder_green",
        "textures/items/dye_powder_lime",
        "textures/items/dye_powder_yellow",
        "textures/items/dye_powder_gray",
        "textures/items/dye_powder_white_new",
        "textures/items/dye_powder_silver",
        "textures/items/dye_powder_magenta",
        "textures/items/dye_powder_purple",
        "textures/items/dye_powder_pink",
        "textures/items/dye_powder_orange",
        "textures/items/dye_powder_brown_new",
        "textures/items/dye_powder_cyan",
        "textures/items/dye_powder_red"
    ],
    text: [
        "§l§0黑色鞘翅", "§l§9蓝色鞘翅",
        "§l§b淡蓝色鞘翅", "§l§2绿色鞘翅",
        "§l§a黄绿色鞘翅", "§l§e黄色鞘翅",
        "§l§7灰色鞘翅", "§l§f白色鞘翅",
        "§l§7淡灰色鞘翅", "§l§d品红色鞘翅",
        "§l§5紫色鞘翅", "§l§d粉红色鞘翅",
        "§l§6橙色鞘翅", "§l§6棕色鞘翅",
        "§l§b青色鞘翅", "§l§c红色鞘翅"
    ]
};

const keyCmd = { // 输入密钥可以用
    elytraShop: (player, cmd) => {
        if (cmd[1] !== "elytra-shop-0000-10496") return;
        player.sendSimpleForm(
            "§l§b鞘翅商店", "购买一个你喜欢的颜色的鞘翅吧！\n§b价格：600蜡烛",
            elytraItemList.text, elytraItemList.textures,
            (player, id) => {
                if (func.isNull(id)) return;
                const elytraData = player.getAllTags()
                    .filter(tag => tag.startsWith("qys_data:elytra:"))
                    .reduce((acc, tag) => [...acc, ...JSON.parse((tag.length > 16 ? tag.slice(16) : "[]"))], []);
                id = id + 1

                if (elytraData.indexOf(id) !== -1) {
                    player.tell("§a你已经拥有这个装扮了！");
                    return keyCmd.elytraShop(player, cmd);

                } else {
                    if (player.getScore("蜡烛") <= 600) return player.tell("§c你没有足够的蜡烛！");
                    func.enRuncmd(player, `scriptevent qys:cmd tagData add elytra [${id}]`);
                    func.enRuncmd(player, "scoreboard players remove @s 蜡烛 600");
                    func.enRuncmd(player, `playsound random.orb @s`);
                    return keyCmd.elytraShop(player, cmd);
                }
            }
        )
    }
}

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
    const command = func.parseArgs(cmd); // 提取主命令
    const eventReturn = !func.isNull(events.emitFirst("onModeCallback", player, command));

    return (() => {
        if (eventReturn) return eventReturn
        else if (playerCmd[command[0]]) return (playerCmd[command[0]](player, command) ?? true);
        else if (keyCmd[command[0]]) return (keyCmd[command[0]](player, command) ?? true);
        else if ((player.isOP() || player.hasTag("op")) && opCmd[command[0]]) return (opCmd[command[0]](player, command, pngMap) ?? true);
        else return null;
    })();
}

function onmodeConsole(ori, out, cmd) {
    cmd = func.parseArgs(cmd);

    events.emitFirst("onModeCallbackConsole", cmd);
}