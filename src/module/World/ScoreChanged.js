const scoreCache = {};

mc.listen("onLeft", (player) => delete scoreCache[player.xuid]);
mc.listen("onJoin", (player) => {
    scoreCache[player.xuid] = {
        金币: player.getScore("金币"),
        蜡烛: player.getScore("蜡烛")
    };
});

mc.listen("onScoreChanged", (player, newScore, name) => {
    if (!(name === "蜡烛" || name === "金币")) return;

    const cache = scoreCache[player.xuid];
    if (!cache) return;

    const delta = newScore - (cache[name] ?? 0);
    if (delta === 0) return;

    cache[name] = newScore;
    player.tell(`§e${name}§r ${delta > 0 ? "+" : ""}${delta}`, 5);
    func.addBehaviorLog(2, "onScoreChanged", player.realName, player.pos,
        `${name}经济变更：${`${delta}`[0] == "-" ? delta : "+" + delta}`
    );
})