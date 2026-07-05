import { Minecraft } from '../../../../GMLIB-LegacyRemoteCallApi/lib/GMLIB_API-JS.js';
import pkg from '../../../../GMLIB-LegacyRemoteCallApi/lib/EventAPI-JS.js';
import * as func from "../../lib/func.js";
const { Event } = pkg;

const AllContainerData = new Map();
const openBoxIds = new Map();
const inBoxGui = new Map();

const disitemMap = new Map();
const lookItemMap = new Map();

mc.listen("onLeft", (pl) => {
    inBoxGui.delete(pl.xuid);
    openBoxIds.delete(pl.xuid);
})

func.addOnmodeCmd("boxui", (player, cmd) => {
    if (cmd.length > 0
        && AllContainerData.has(cmd[0])
    ) showFakeChest(player, cmd[0], cmd[1] ?? null);
});

func.addOnmodeCmd("disitem", (player, cmd) => {
    switch (cmd?.[0]) {
        case "add":
            const item = (player.getHand()).clone();
            if (!item) return player.tell("你没有拿起物品!");
            item.setLore([`§l§b${player.realName} 的展示物品`, ...item.lore]);
            disitemMap.set(player.realName, item.getNbt().toSNBT());
            mc.broadcast(`[§aTip§r] ${player.realName} 广播了物品展示！\n可输入 /om disitem list 查看物品！`)
            // player.tell(`[§aTip§r] ${player.realName} 广播了物品展示！\n可输入 /om disitem list 查看物品！`)
            break;

        case "remove":
            disitemMap.delete(player.realName);
            player.tell("物品展示广播已移除！");
            break;
        
        case "list":
            if (disitemMap.length < 1) return player.tell("目前还没有人广播物品哦...");
            
            const names = Array.from(disitemMap.keys());
            const fm = mc.newSimpleForm()
                .setTitle("物品展示广播")
                .setContent("");
            names.forEach((name) => fm.addButton(`${name} 广播的物品`));

            player.sendForm(fm, (player, id) => {
                if (func.isNull(id)) return;
                lookItemMap.set(player.xuid, names[id]);
                showFakeChest(player, "itemUI", "boxui-item-0000-10010");
            })
            break;
    
        default:
            player.tell("参数错误! 支持的参数：add, remove, list")
            break;
    }
})

addContainerData("itemUI", {
    boxId: -30,
    title: "物品展示",
    container: {
        id: "Hopper",
        type: 8,
        block: "minecraft:hopper"
    },
    key: "boxui-item-0000-10010",
    data: (player) => {
        const lookPlayer = lookItemMap.get(player.xuid);
        lookItemMap.delete(player.xuid);
        return [{
            item: mc.newItem(NBT.parseSNBT(disitemMap.get(lookPlayer))),
            slot: 2,
        }];
    }
})

addContainerData("elytraUI", {
    boxId: -30,
    title: "鞘翅设置",
    container: {
        id: "Chest",
        type: 0,
        block: "minecraft:chest"
    },
    key: "boxui-elytra-0000-10010",
    event: (player, slot) => {
        if (slot === 4 || slot === 13) return;
        let skinId = slot;
        if (slot >= 0 && slot < 4) skinId += 1;
        if (slot > 13) skinId -= 1;
        skinId = skinId == 19 ? 18 : skinId == 21 ? 0 : skinId == 23 ? 20 : skinId == 25 ? 19 : skinId;
        const elytraData = player.getAllTags()
            .filter(tag => tag.startsWith("qys_data:elytra:"))
            .reduce((acc, tag) => [...acc, ...JSON.parse((tag.length > 16 ? tag.slice(16) : "[]"))], []);
        if (elytraData.indexOf(skinId) === -1 && skinId !== 0) return func.enRuncmd(player, "playsound mob.villager.no @s ~~~ 100 1 100");
        func.enRuncmd(player, "playsound random.orb @s");
        func.enRuncmd(player, `scriptevent qys:cmd property qys:elytra_color ${skinId}`);
    },
    data: () => {
        return [
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:black_dye","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§0黑色鞘翅"},"ench":[]}}`)),
                slot: 0
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:blue_dye","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§9蓝色鞘翅"},"ench":[]}}`)),
                slot: 1
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:light_blue_dye","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§b淡蓝色鞘翅"},"ench":[]}}`)),
                slot: 2
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:green_dye","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§2绿色鞘翅"},"ench":[]}}`)),
                slot: 3
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Block":{"name":"minecraft:barrier","states":{},"version":18168865},"Count":1b,"Damage":0s,"Name":"minecraft:barrier","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":""},"ench":[]}}`)),
                slot: 4
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:lime_dye","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§a黄绿色鞘翅"},"ench":[]}}`)),
                slot: 5
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:yellow_dye","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§e黄色鞘翅"},"ench":[]}}`)),
                slot: 6
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:gray_dye","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§7灰色鞘翅"},"ench":[]}}`)),
                slot: 7
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:white_dye","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§f白色鞘翅"},"ench":[]}}`)),
                slot: 8
            },

            // 第2行 (slot 9-17)
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:light_gray_dye","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§7淡灰色鞘翅"},"ench":[]}}`)),
                slot: 9
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:magenta_dye","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§d品红色鞘翅"},"ench":[]}}`)),
                slot: 10
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:purple_dye","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§5紫色鞘翅"},"ench":[]}}`)),
                slot: 11
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:pink_dye","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§d粉红色鞘翅"},"ench":[]}}`)),
                slot: 12
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Block":{"name":"minecraft:barrier","states":{},"version":18168865},"Count":1b,"Damage":0s,"Name":"minecraft:barrier","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":""},"ench":[]}}`)),
                slot: 13  // 中间的槽位
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:orange_dye","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§6橙色鞘翅"},"ench":[]}}`)),
                slot: 14
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:brown_dye","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§6棕色鞘翅"},"ench":[]}}`)),
                slot: 15
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:cyan_dye","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§b青色鞘翅"},"ench":[]}}`)),
                slot: 16
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:red_dye","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§c红色鞘翅"},"ench":[]}}`)),
                slot: 17
            },

            // 第3行 (slot 18-26)
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:feather","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§f羽毛鞘翅"},"ench":[]}}`)),
                slot: 18
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:air","WasPickedUp":0b}`)),
                slot: 19
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Block":{"name":"minecraft:dragon_egg","states":{},"version":18168865},"Count":1b,"Damage":0s,"Name":"minecraft:dragon_egg","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§5末影龙翅膀"},"ench":[]}}`)),
                slot: 20
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:air","WasPickedUp":0b}`)),
                slot: 21
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:elytra","WasPickedUp":0b,"tag":{"Damage":0,"RepairCost":0,"display":{"Name":"原版鞘翅"},"ench":[]}}`)),
                slot: 22
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:air","WasPickedUp":0b}`)),
                slot: 23
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:dragon_head","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§b末影龙翅膀 Pro"},"ench":[]}}`)),
                slot: 24
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:air","WasPickedUp":0b}`)),
                slot: 25
            },
            {
                item: mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:phantom_membrane","WasPickedUp":0b,"tag":{"RepairCost":0,"display":{"Name":"§7幻翼鞘翅"},"ench":[]}}`)),
                slot: 26
            }
        ]
    }
})

// 容器物品处理请求
Event.emplaceListener(
    "gmlib::HandleRequestActionAfterEvent", (event) => {
        const params = event.params;
        if (!inBoxGui.has(params[0].xuid)
            || params[3] == "InventoryContainer"
            || params[3] == "HotbarContainer"
            || params[1] != "Place"
        ) return;

        AllContainerData.get(inBoxGui.get(params[0].xuid).name)?.event(params[0], params[4]);

        /*
        
        const player = params[0]
        player.tell("==============")
        player.tell(`类型: ${params[1]}`);
        player.tell(`数量: ${params[2]}`);
        player.tell(`原容器: ${params[3]} 槽: ${params[4]}`);
        player.tell(`目标容器: ${params[5]} 槽: ${params[6]}`);
        //*/
    }
)

// 容器界面关闭
Event.emplaceListener(
    "gmlib::ContainerClosePacketSendAfterEvent", (event) => {
        const pl = event.params[0];
        if (!inBoxGui.has(pl?.xuid)) return;
        const pos = inBoxGui.get(pl.xuid).pos;
        sendUpdateBlockPacket(pl, pos, mc.getBlock(pos)?.type || "minecraft:air");

        inBoxGui.delete(pl.xuid);
        openBoxIds.delete(pl.xuid);
    }
)

function showFakeChest(player, name, key = null) {
    if (player.gameMode === 6 || !AllContainerData.has(name)) return;
    const containerData = AllContainerData.get(name);
    if (key != containerData?.key) return;
    openBoxIds.set(player.xuid, name);

    try {
        // 计算箱子位置
        const chestPos = new IntPos(player.pos.x, player.pos.y + 1, player.pos.z, player.pos.dimid);

        // 发送方块数据包
        sendUpdateBlockPacket(player, chestPos, containerData.container.block);
        mc.runcmdEx( // 用sendUpdateBlockPacket发箱子块会炸，用这个先顶一下
            `jsdebug (()=>{`
            + `const packet = new BinaryStream();`
            + `packet.writeVarInt(${chestPos.x});`
            + `packet.writeUnsignedVarInt(${chestPos.y});`
            + `packet.writeVarInt(${chestPos.z});`
            + `packet.writeUnsignedVarInt(${Minecraft.getBlockRuntimeId(containerData.container.block)});`
            + `packet.writeUnsignedVarInt(0);`
            + `packet.writeUnsignedVarInt(0);`
            + `(mc.getPlayer("${player.realName}")).sendPacket(packet.createPacket(21));`
            + `})()`
        );

        // 设置方块实体数据
        const blockEntityData = new NbtCompound({
            'Findable': new NbtByte(0),
            'id': new NbtString(containerData.container.id),
            'isMovable': new NbtByte(1),
            'x': new NbtInt(chestPos.x),
            'y': new NbtInt(chestPos.y),
            'z': new NbtInt(chestPos.z),
            'CustomName': new NbtString(containerData.title ?? "§§")
        });
        if (containerData.container.type === 8) // 漏斗特有字段
            blockEntityData.setInt("TransferCooldown", 0)

        const packet = new BinaryStream();
        packet.writeVarInt(chestPos.x);
        packet.writeUnsignedVarInt(chestPos.y);
        packet.writeVarInt(chestPos.z);
        packet.writeCompoundTag(blockEntityData ?? new NbtCompound());
        player.sendPacket(packet.createPacket(56));

        setTimeout(() => {
            sendOpenContainerPacket(player, chestPos, containerData.boxId, containerData.container.type);
            inBoxGui.set(player.xuid, { pos: chestPos, name: name });
            const boxData = containerData.data(player);

            // 填充容器内容
            for (const data of boxData) {
                player.sendInventorySlotPacket(containerData.boxId, data.slot, data.item);
            }
        }, 200);

    } catch (error) {
        player.tell(`[§cError§r]: 创建箱子数据包时出错\n ${error}`);
        logger.error(`创建箱子数据包时出错\n ${error}`);

        inBoxGui.delete(player.xuid);
        openBoxIds.delete(player.xuid);
    }
}


/**
 * 添加容器数据
 * @param {string} name - 数据存储的键名
 * @param {*} data - 要存储的数据值
 * @returns {*} - 返回AllContainerData.set()的执行结果
 * 
 * 功能说明：
 * - 将数据存储到全局容器中
 * - 如果name或data为null/undefined，则直接返回false不执行存储
 * - 成功执行后返回容器set方法的返回值
 */
function addContainerData(name, data) {
    if (name == null || data == null) return false;
    return AllContainerData.set(name, data);
}

/**
 * 发送打开容器数据包
 * @param {Player} player - 玩家对象
 * @param {IntPos} pos - 箱子位置
 * @param {number} containerId - 容器ID
 * @param {number} dimension - 维度ID
 * @param {number} runtimeEntityId - 运行时实体ID
 */
function sendOpenContainerPacket(player, pos, containerId, dimension = 0, runtimeEntityId = -1) {
    const packet = new BinaryStream();
    packet.writeByte(Number(containerId));
    packet.writeByte(Number(dimension));
    packet.writeVarInt(pos.x);
    packet.writeUnsignedVarInt(pos.y);
    packet.writeVarInt(pos.z);
    packet.writeVarInt64(Number(runtimeEntityId));
    player.sendPacket(packet.createPacket(46));
}

/**
 * 发送关闭容器数据包
 * @param {Player} player - 玩家对象
 * @param {number} containerId - 容器ID
 * @param {boolean} server - 是否服务器端关闭
 */
function sendCloseContainerPacket(player, containerId, server = false) {
    const packet = new BinaryStream();
    packet.writeByte(Number(containerId));
    packet.writeByte(Number(server));
    packet.writeBool(Boolean(server));
    player.sendPacket(packet.createPacket(47));
}

/**
 * 发送方块更新数据包
 * @param {Player} player - 玩家对象
 * @param {IntPos} pos - 方块位置
 * @param {string|number} blockRuntimeId - 方块运行时ID或名称
 * @param {number} layer - 方块层
 * @param {number} flags - 标志位
 */
function sendUpdateBlockPacket(player, pos, blockRuntimeId, layer = 0, flags = 0) {
    const packet = new BinaryStream();
    packet.writeVarInt(pos.x);
    packet.writeUnsignedVarInt(pos.y);
    packet.writeVarInt(pos.z);
    packet.writeUnsignedVarInt(typeof blockRuntimeId === 'string' ? Minecraft.getBlockRuntimeId(blockRuntimeId) : Number(blockRuntimeId));
    packet.writeUnsignedVarInt(Number(layer));
    packet.writeUnsignedVarInt(Number(flags));
    player.sendPacket(packet.createPacket(21));
}