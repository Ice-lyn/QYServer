import * as func from "../../lib/func.js";

const villagerList = [
    "minecraft:villager",
    "minecraft:villager_v2",
    "minecraft:wandering_trader"
];

mc.listen("onPlayerInteractEntity", (player, entity, pos) => {
    if (!(player.isSneaking
        && villagerList.includes(entity.type)
        && player.getHand().type === "minecraft:book"
        && func.LandJudgment(player, pos)
    )) return;

    const item = player.getHand();
    const profession = entity.getNbt().getData("PreferredProfession");
    const tradeData = JSON.parse(
        item
            ?.getNbt()
            ?.getTag("tag")
            ?.getData("qys:VillageTrade") ?? null
    ) ?? false;

    if (item.count > 1) return player.tell("手持物品堆叠数不唯一！请使用单个堆叠的来进行存储！");
    if (tradeData) { // 覆盖
        if (tradeData.profession !== profession)
            return player.tell("村民职业不相同，无法覆盖！");

        player.sendModalForm("覆盖确认",
            "这将会将当前村民的交易列表修改为其他内容\n此操作无法撤销，是否继续？",
            "√ 确认覆盖", "X 我再想想",
            (player, id) => {
                if (!id) return;

                entity.setNbt(entity.getNbt().setTag("Offers", NBT.parseSNBT(tradeData.tradeList)))
                item.setNull();
                player.refreshItems();
            })

    } else { // 写入
        const tradeData = JSON.stringify({
            profession: profession,
            tradeList: entity.getNbt().getTag("Offers").toSNBT()
        });

        const itemNbt = item.getNbt()
        itemNbt.setTag("tag", (itemNbt.getTag('tag') ?? new NbtCompound())
            .setString("qys:VillageTrade", tradeData)
            .setByte("minecraft:item_lock", 2)
            .setTag("ench", new NbtList())
        );

        item.setNbt(itemNbt);
        item.setLore(["村民交易列表存储", `当前存储的村民职业: ${profession}`]);
        player.refreshItems();
        player.tell("村民交易表已写入！潜行右键其他村民即可完成迁移！")
    }
    return false;
})