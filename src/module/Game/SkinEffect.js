// 皮肤特效配置
const SkinEffect = new Map([
    ["1", { // 小月
        add: [[1, 1]],
        remove: [1]
    }],
    ["2", { // 爱丽丝
        add: [[29, 10], [3, 2], [10, 2]],
        remove: [29, 3, 10]
    }],
    ["3", { // 猫猫
        add: [[1, 2], [16, 1]],
        remove: [1, 16]
    }],
    ["5", { // 莉莉丝
        add: [[5, 5], [3, 5], [16, 5]],
        remove: [5, 3, 16]
    }],
    ["6", { // 怕怕
        add: [[1, 2]],
        remove: [1]
    }]
])

// 玩家移除效果事件
mc.listen("onRespawn", (pl) => {
    const beforeSkin = pl.getAllTags().find(t => t.startsWith('qys:beforeSkin_'))?.split('_')[1] || null;
    if (beforeSkin) return setSkinEffect(pl, beforeSkin, 1);
})

// 皮肤装备相关
mc.listen("onSetArmor", (pl, slotNum, item) => {
    if (!pl?.inWorld || !(slotNum === 1 || slotNum === 0)) return;

    const skinNum = item?.type?.match(/skin_item_(\d+)/)?.[1] || null;
    const beforeSkin = pl.getAllTags().find(t => t.startsWith('qys:beforeSkin_'))?.split('_')[1] || null;
    if (beforeSkin === null && skinNum === null) return;

    if (skinNum !== null) { // 穿上
        if (beforeSkin !== null) setSkinEffect(pl, beforeSkin, 0);
        setSkinEffect(pl, skinNum, 1);
    } else if (skinNum === null && beforeSkin !== null) {// 脱下
        setSkinEffect(pl, beforeSkin, 0);
    }
})


/**
 * 设置玩家使用皮肤的效果
 * @param {Player} pl - 目标玩家对象
 * @param {string} skinNum - 皮肤ID
 * @param {number} mode - 设置模式 (0:移除，1:添加)
 */
function setSkinEffect(pl, skinNum, mode) {
    const effect = SkinEffect.get(skinNum) || null;
    skinNum = Number(skinNum);
    if (mode) {
        switch (skinNum) {
            case 3:
                pl.addTag("isCat");
                break;
            case 5:
                mc.runcmdEx(`ability "${pl.realName}" mayfly true`);
                break;
            case 7:
                mc.runcmdEx(`playanimation "${pl.realName}" animation.player.qys_riru none 1 "" riru`);
                break;
            case 8:
                mc.runcmdEx(`playanimation "${pl.realName}" animation.player.qys_horror none 1 "" horror`);
                break;
        }
        if (skinNum !== 8) pl.addEffect(14, 9999999, 1, false);
        pl.addTag("qys:beforeSkin_" + skinNum);
    } else {
        switch (skinNum) {
            case 3:
                pl.removeTag("isCat");
                break;
            case 5:
                mc.runcmdEx(`ability @a[name="${pl.realName}",m=!1,scores={飞行药水时长=..1}] mayfly false`);
                break;
            case 7:
                mc.runcmdEx(`playanimation "${pl.realName}" animation.player.qys_recover none 0 "" riru`);
                break;
            case 8:
                mc.runcmdEx(`playanimation "${pl.realName}" animation.player.qys_recover none 0 "" horror`);
                break;
        }
        if (skinNum !== 8) pl.removeEffect(14);
        pl.removeTag("qys:beforeSkin_" + skinNum);
    }

    if (effect === null) return;
    const operation = mode ? effect.add : effect.remove;
    operation.forEach(params => {
        if (mode) pl.addEffect(params[0], 9999999, params[1], true);
        else pl.removeEffect(params);
    })
}