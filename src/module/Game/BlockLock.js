import { config } from "../../../Config/config.js";
import * as func from "../../lib/func.js";

const lockData = new JsonConfigFile("./plugins/QYServer/Data/BlockLock.json");
const useCD = new Set();

const getLandId = (pos) => ll.imports('ILAPI_PosGetLand')({ 
    'x': pos.x,
    'y': pos.y,
    'z': pos.z,
    'dimid': pos.dimid
});

// === 大概实现逻辑 === //
/**
 * 设计灵感来源与xiang5232机器的漏斗分类总是被小白弄坏
 * 和Miao924总是被破门而入
 * 
 * 玩家只能在受信任的领地内使用
 * 创建者和领地主可以自由设置锁
 * 领地失效自动解锁
 * 上锁的数据存储在外部
 * 数据存储格式：pos: "上锁者的xuid"
 */

// 右键方块 禁止打开
mc.listen("onUseItemOn", (player, item, block) => {
    if (!lockData.get(func.pos2str(block.pos, 1))) return;

    if (getLandId(block.pos) === -1) // 领地失效自动解锁
        return lockData.delete(func.pos2str(block.pos, 1));

    const lockName = data.xuid2name(lockData.get(func.pos2str(block.pos, 1))) || "未知玩家";
    player.tell(
        `此方块已被 ${lockName} 上锁, 请联系对方解锁！`
        + "\n> §b如果你是上锁的玩家或领地主§r"
        + "\n> §b可以潜行并手持钟表菜单右键方块解锁！",
    5);
    func.enRuncmd(player, "playsound mob.villager.no")
    return false;
})

// 右键方块 上锁
mc.listen("onUseItemOn", (player, item, block) => {
    if (!(player?.isSneaking
        && item?.type === "minecraft:clock"
        && config.lockBlock.test(block?.type)
        && func.LandJudgment(player, block.pos)
        && !useCD.has(player.xuid)
    )) return;

    const strPos = func.pos2str(block.pos, 1);

    // 没上锁: 上锁
    if (!lockData.get(strPos)
        && func.LandJudgment(player, block.pos)
    ) {
        if (lockData.set(strPos, player.xuid)) {
            player.tell("方块§c上锁§r成功！", 5);
            func.enRuncmd(player, "playsound random.orb");
        } else player.tell("方块§c上锁§r失败...", 5)

    } // 上锁了: 解锁
    else if (lockData.get(strPos) === player.xuid
        || ll.imports('ILAPI_IsLandOwner')(getLandId(block.pos), player.xuid)
    ) {
        if (lockData.delete(strPos)) {
            player.tell("方块§a解锁§r成功！", 5);
            func.enRuncmd(player, "playsound random.orb");
        } else player.tell("方块§a解锁§r失败...")
    } // 黑神话: 悟空
    // else { log("猿神，启动！") }

    const xuid = player.xuid;
    useCD.add(xuid);
    setTimeout(() => useCD.delete(xuid), 50)
})