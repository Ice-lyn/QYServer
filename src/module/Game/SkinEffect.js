import * as func from "../../lib/func.js";

const beforeSkinMap = new Map();
const skinEffectData = { // 皮肤特效配置
    1: { // 小月
        add: [[1, 1]],
        remove: [1]
    },
    2: { // 爱丽丝
        add: [[29, 10], [3, 2], [10, 2]],
        remove: [29, 3, 10]
    },
    3: { // 猫猫
        add: [[1, 2], [16, 1]],
        remove: [1, 16]
    },
    5: { // 莉莉丝
        add: [[5, 5], [3, 5], [16, 5]],
        remove: [5, 3, 16]
    },
    6: { // 怕怕
        add: [[1, 2]],
        remove: [1]
    }
}

// 玩家退出
mc.listen("onLeft", (player) => beforeSkinMap.delete(player.xuid));

// 玩家移除效果事件
mc.listen("onRespawn", (player) => {
    const beforeSkin = getBeforeSkin(player);
    if (beforeSkin) setSkinEffect(player, beforeSkin, 1);
    else if (beforeSkin === -1) player.addEffect(14, 9999999, 1, false)
})

// 皮肤装备相关
mc.listen("onSetArmor", (player, slotNum, item) => {
    if (!(player?.inWorld && (slotNum === 0 || slotNum === 1))) return;
    const beforeSkin = getBeforeSkin(player);
  
    // 脱下
    if (beforeSkin) {
        if (beforeSkin === -1) {
            player.removeEffect(14);
            setBeforeSkin(player, beforeSkin, 0)
        } else {
            setBeforeSkin(player, beforeSkin, 0);
            setSkinEffect(player, beforeSkin, 0);
        }
    }

    // 穿上
    if (item?.type?.startsWith("qys:skin_")) {
        if (item.type.startsWith("qys:skin_item_")) {
            const skinNum = Number(item.type.match(/skin_item_(\d+)/)[1]);
            setSkinEffect(player, skinNum);
            setBeforeSkin(player, skinNum);
        } else {
            player.addEffect(14, 9999999, 1, false);
            setBeforeSkin(player, -1);
        }
    }
})

function getBeforeSkin(player) {
    if (beforeSkinMap.has(player.xuid))
        return beforeSkinMap.get(player.xuid);

    const skinNum = Number(
        player.getAllTags()
            ?.find(t => t.startsWith('qys:beforeSkin_'))
            ?.split('_')?.[1] || 0
    );
    beforeSkinMap.set(player.xuid, skinNum);
    return skinNum;
}

function setBeforeSkin(player, skinNum, mode = 1) {
    switch (mode) {
        case 0:
            player.removeTag("qys:beforeSkin_" + skinNum);
            beforeSkinMap.delete(player.xuid);
            break;
        case 1:
            player.addTag("qys:beforeSkin_" + skinNum);
            beforeSkinMap.set(player.xuid, skinNum);
            break;
    }
}

function setSkinEffect(player, skinNum, mode = 1) {
    if (!skinNum) return;
    const effectData = skinEffectData[skinNum];
  
    if (mode) {
        effectData?.add?.forEach(data => player.addEffect(data[0], 9999999, data[1], false));
        if (skinNum !== 8) player.addEffect(14, 9999999, 1, false);
        switch (skinNum) {
            case 5:
                mc.runcmdEx(`ability "${player.realName}" mayfly true`);
                break;
            case 7:
                mc.runcmdEx(`playanimation "${player.realName}" animation.player.qys_riru none 1 "" riru`);
                break;
            case 8:
                mc.runcmdEx(`playanimation "${player.realName}" animation.player.qys_horror none 1 "" horror`);
                break;
        }
    } else {
        effectData?.remove?.forEach(data => player.removeEffect(data));
        if (skinNum !== 8) player.removeEffect(14);
        switch (skinNum) {
            case 5:
                mc.runcmdEx(`ability @a[name="${player.realName}",m=!1,scores={飞行药水时长=..1}] mayfly false`);
                break;
            case 7:
                mc.runcmdEx(`playanimation "${player.realName}" animation.player.qys_recover none 0 "" riru`);
                break;
            case 8:
                mc.runcmdEx(`playanimation "${player.realName}" animation.player.qys_recover none 0 "" horror`);
                break;
        }
    }
}