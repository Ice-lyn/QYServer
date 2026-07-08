import { config } from "../../../Config/config.js";
import * as func from "../../lib/func.js";

const candleScore = mc.getScoreObjective("蜡烛");
const coinScore = mc.getScoreObjective("金币");

// 蜡烛
const candleData = config.shop.candle;
const candleItemData = {
    text: Object.keys(candleData),
    icon: Object.values(candleData)
        .map(i => i.icon ?? "textures/items/magic")
};

// 金币
const coinData = config.shop.coin;
const coinItemData = {
    text: Object.keys(coinData),
    icon: Object.values(coinData)
        .map(i => i.icon ?? "")
};

func.addOnmodeCmd("mainCityShop", (player, cmd) => {
    if (cmd[0] !== "mainCity-key-0000-114514") return;

    if (cmd[1] === "candle")
        candleShop(player);
    else
        coinShop(player);
})

// 蜡烛商店
function candleShop(player) {
    const money = candleScore.getScore(player);

    player.sendSimpleForm(
        "§l§b蜡烛商店§r",
        `您当前有 §b§l${money}§r 蜡烛\n使用蜡烛兑换各种物品吧~`,
        candleItemData.text.map(i => `${i}§r\n§e(${candleData[i].money} 蜡烛)§r`),
        candleItemData.icon,
        (player, id) => {
            if (func.isNull(id)) return;

            const itemData = candleData[candleItemData.text[id]];

            if (money >= itemData.money) {
                [
                    ...itemData.cmd,
                    "playsound random.levelup @s"
                ].forEach(cmd => func.enRuncmd(player, cmd));
            } else player.tell("§l§b蜡烛不足，无法购买");

            candleShop(player);
        }
    )
}

// 金币商店
function coinShop(player) {
    const money = coinScore.getScore(player);

    player.sendSimpleForm(
        "§l§e金币商店§r",
        `您当前有 §e§l${money}§r 金币\n使用金币兑换各种物品吧~`,
        coinItemData.text.map(i => `${i}§r\n§e(${coinData[i].money} 蜡烛)§r`),
        coinItemData.icon,
        (player, id) => {
            if (func.isNull(id)) return;

            const itemData = coinData[coinItemData.text[id]];

            if (money >= itemData.money) {
                [
                    ...itemData.cmd,
                    "playsound random.levelup @s"
                ].forEach(cmd => func.enRuncmd(player, cmd));
            } else player.tell("§l§e金币不足，无法购买");

            coinShop(player);
        }
    )
}

