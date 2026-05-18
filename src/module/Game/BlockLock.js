import * as func from "../../lib/func.js";

const useCD = new Set();
const lockData = new JsonConfigFile("./plugins/QYServer/Data/BlockLock.json");
const lockBlock = new Set([
    "minecraft:chest", // 箱子
    "minecraft:trapped_chest", // 陷阱箱
    "minecraft:hopper" // 漏斗
]);
const getLandId = (pos) => ll.imports('ILAPI_PosGetLand')({ 
    'x': pos.x,
    'y': pos.y,
    'z': pos.z,
    'dimid': pos.dimid
});

// === 大概实现逻辑 === //
/**
 * 设计灵感来源与xiang5929机器的漏斗分类总是被小白弄坏
 * 
 * 玩家只能在受信任的领地内使用
 * 创建者和领地主可以自由设置锁
 * 领地失效自动解锁
 * 上锁的数据存储在外部
 * 数据存储格式：pos: "上锁者的xuid"
 */

// 打开容器GUI
mc.listen("onOpenContainer", (player, block) => {
    if (!lockData.get(func.pos2str(block.pos))) return;

    if (getLandId(block.pos) === -1) // 领地失效自动解锁
        return lockData.delete(func.pos2str(block.pos));

    const lockName = data.xuid2name(lockData.get(func.pos2str(block.pos))) || "未知玩家";
    player.tell(
        `此方块已被 ${lockName} 上锁, 请联系对方解锁！`
        + "\n> 如果你是上锁的玩家或领地主，可以潜行并手持钟表菜单右键方块解锁！"
    );
    return false;
})

// 右键方块
mc.listen("onUseItemOn", (player, item, block) => {
    if (!(player.isSneaking
        && item.type === "minecraft:clock"
        && func.LandJudgment(player, block.pos)
        && !useCD.has(player.xuid)
    )) return;

    // 没上锁: 上锁
    if (!lockData.get(func.pos2str(block.pos))
        && func.LandJudgment(player, block.pos)
    ) {
        lockData.set(func.pos2str(block.pos), player.xuid);
        player.tell("方块上锁成功！再次操作可解锁");

    } // 上锁了: 解锁
    else if (lockData.get(func.pos2str(block.pos)) === player.xuid
        || ll.imports('ILAPI_IsLandOwner')(getLandId(block.pos), player.xuid)
    ) {
        lockData.delete(func.pos2str(block.pos));
        player.tell("方块解锁成功！在此操作可上锁");

    } // 黑神话: 悟空
    // else { log("猿神，启动！") }

    const xuid = player.xuid;
    useCD.add(xuid);
    setTimeout(() => useCD.delete(xuid), 50)
})