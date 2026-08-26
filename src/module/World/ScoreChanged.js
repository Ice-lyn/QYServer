import * as func from "../../lib/func.js";
const scoreCache = new Map();

mc.listen("onLeft", (pl) => scoreCache.delete(pl.xuid));
mc.listen("onJoin", (pl) => {
    scoreCache.set(pl.xuid, {
        金币: pl.getScore("金币"),
        蜡烛: pl.getScore("蜡烛")
    });
});

mc.listen("onScoreChanged", (player, newScore, name) => {
    if (!(name === "蜡烛" || name === "金币")) return;
    
    const cache = scoreCache.get(player.xuid) ?? {};
    if (!cache) return;
    const delta = newScore - (cache[name] ?? 0);

    if (delta === 0) return;
    player.tell(`§e${name}§r ${`${delta}`[0] == "-" ? delta : "+" + delta}`, 5);
    func.addBehaviorLog(2, "onScoreChanged", player.realName, player.pos,
        `${name}经济变更：${`${delta}`[0] == "-" ? delta : "+" + delta}`
    );
})