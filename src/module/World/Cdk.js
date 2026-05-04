import * as func from "../../lib/func.js";
const cdkData = new JsonConfigFile("./plugins/QYServer/Data/cdk.json");

{// 注册指令
    const cmd = mc.newCommand("cdks", "§a兑换码系统", PermType.Any);
    cmd.optional("cdk", ParamType.RawText);
    cmd.setCallback((_cmd, ori, out, res) => {
        const cdk = res.cdk;
        const player = ori.player;

        // cdk --addcdk=10
        if (cdk === "--addcdk") return addCdk(cdk?.split("=")?.[1], 7);
        if (func.isNull(player)) return out.error("找不到，怎么找也找不到！");
        if (!func.isNull(cdk)) return useCDK(player, cdk);

        const fm = mc.newCustomForm()
            .setTitle("CDK")
            .addLabel("可以在这里输入你获取到的兑换码!")
            .addInput("请输入你的兑换码:");

        player.sendForm(fm, (pl, res) => {
            if (func.isNull(res)) return;
            useCDK(player, res[0]);
        });
    });
    cmd.overload(["cdk"]);
    cmd.setup();
}

function useCDK(player, cdk) {
    if (!cdkData.has(cdk)) return player.tell("该CDK不存在！");
    let data = cdkData.get(cdk);
    data = {
        use: data.use ?? 0, // 可以使用多少次
        cmd: data.cmd ?? [], // 命令列表
        items: data.items ?? [], // 物品列表
        usePlayers: data.usePlayers ?? [] // 已使用玩家列表
    };

    if (data.num === -1) { // 无限次
        if (data.usePlayers.includes(player.name)) return player.tell("你已经兑换过了！");
        giveCdkPacks(player, data);
        data.usePlayers = data.usePlayers.push(player.name);
        cdkData.set(cdk, data);

    } else if (data.num === 0) { // 单次
        giveCdkPacks(player, data);
        cdkData.delete(cdk);

    } else if (data.num >= 1) { // 限量
        if (data.usePlayers.includes(player.name)) return player.tell("你已经兑换过了！");
        giveCdkPacks(player, data);

        data.num = data.num - 1;
        data.usePlayers = data.usePlayers.push(player.name);

        if (data.num === 0) cdkData.delete(cdk);
        else cdkData.set(cdk, data);
    }

    async function giveCdkPacks(player, data) {
        data.cmd.forEach(cmd => func.enRuncmd(player, cmd));
        data.items.forEach(items => {
            let item = func.isNull(items?.snbt)
                ? mc.newItem(items.type, items.count)
                : mc.newItem(NBT.parseSNBT(items.snbt));
            player.giveItem(item);
        });
        player.tell("物品已给予！");
    }
}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function addCdk(number, cdkLength = 7) {
    for (let i = 0; i < number; i++) {
        let code = '';
        for (let i = 0; i < length; i++) code += chars.charAt(
            Math.floor(Math.random() * chars.length)
        );
        cdkData.set(code, {
            use: null,
            cmd: [],
            items: []
        });
    }
}
