const playerTime = new KVDatabase("./plugins/QYServer/Data/PlayerTime");

mc.listen("onJoin", (pl) => {
    if (playerTime.get(pl.realName) !== null) return;
    playerTime.set(
        pl.realName,// usfID为初加入时间戳
        pl.getNbt()
            ?.getTag("DynamicProperties")
            ?.getTag("9472c503-5a92-43c8-7ddf-0492de2362d7")
            ?.getData("usfV2:id") ?? Date.now()
    )
})

func.addOnmodeCmd("pltime", (player) => {
    playerTimeUI(player);
});


ll.onUnload(() => {
    playerTime.close();
})

// 查询历史玩家
function playerTimeUI(player) {
    const data = new Map(); // { 玩家名: 时间戳 }
    for (const key of playerTime.listKey()) {
        data.set(key, playerTime.get(key));
    }

    const format = t => {
        const d = new Date(+t);
        const pad = n => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    const todayStart = new Date().setHours(0, 0, 0, 0);
    const today = [], history = [];

    data.forEach((t, n) => {
        const ts = +t;
        ts >= todayStart && ts < todayStart + 86400000 ?
            today.push(`${n} - ${format(t)}`) :
            history.push({ name: n, time: ts, formatted: format(t) });
    })

    // 按年份->月份分组并统计人数
    const historyByYear = {};
    history.sort((a, b) => a.time - b.time).forEach(p => {
        const d = new Date(p.time);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;

        if (!historyByYear[year]) historyByYear[year] = {};
        if (!historyByYear[year][month]) historyByYear[year][month] = { count: 0, list: [] };

        historyByYear[year][month].count++;
        historyByYear[year][month].list.push(`§a§l${p.name}§r - (${p.formatted})`);
    })

    // 构建显示内容
    let historyContent = '';
    for (const year in historyByYear) {
        historyContent += `# ${year}年\n\n`;
        for (const month in historyByYear[year]) {
            const monthData = historyByYear[year][month];
            historyContent += `=== ${month}月 (${monthData.count}人) ===\n${monthData.list.join('\n')}\n\n`;
        }
        historyContent += '\n';
    }

    const showList = (title, content, returnMain = true) => {
        const fm = mc.newSimpleForm()
            .setTitle(title)
            .setContent(content);
        if (returnMain) fm.addButton('返回主菜单');
        player.sendForm(fm, (pl, id) => id === 0 && returnMain && playerTimeUI(pl));
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '-');
    const main = mc.newSimpleForm()
        .setTitle('玩家加入时间查询')
        .setContent(`今日(${todayStr})新增: ${today.length}人\n历史记录: ${history.length}人`)
        .addButton('查看今日玩家')
        .addButton('查看历史玩家')
        .addButton('搜索玩家');

    player.sendForm(main, (pl, id) => {
        if (id === 0) showList(`今日玩家 (${today.length}人)`, today.join('\n'));
        else if (id === 1) showList('历史玩家', historyContent.trim());
        else if (id === 2) {
            const searchForm = mc.newCustomForm()
                .setTitle('搜索玩家')
                .addInput('输入玩家名 §b(支持模糊搜索)§r', '')
            pl.sendForm(searchForm, (pl2, res) => {
                if (!res) return playerTimeUI(pl2);
                const search = res[0].toLowerCase();
                const results = Array.from(data.entries())
                    .filter(([n]) => n.toLowerCase().includes(search))
                    .map(([n, t]) => `§a§l${n}§r - ${format(t)}`);
                showList(`搜索结果 (${results.length}个)`, results.join('\n'), false);
            })
        }
    })
}

