import * as func from "../../lib/func.js";
import axios from "axios";

// 加入
mc.listen("onJoin", (player) => {
    if (func.isNull(player)
        || player.isSimulatedPlayer()
    ) return;

    try {
        const device = player.getDevice();
        const res = (await axios.get(
            `https://uniteban.megastudio.cn/api/check_ban.php`,
            {
                params: {
                    data: Buffer.from(JSON.stringify({
                        xuid: player.xuid,
                        client_id: device.clientId,
                        ip_address: device.ip
                    })).toString('base64')
                },
                headers: {
                    'Authorization': 'Bearer ',
                    'Content-Type': 'application/json'
                },
                timeout: 50000
            }
        )).data.data;

        if (!res.banned) return;

        const banMsg = [
            `玩家 ${res.player_name} 命中公共云黑，已处理...`,
            `  - 封禁原因: ${res.ban.reason}`,
            `  - 来源服务器: ${res.ban.server_name}`
        ].join("\n");

        player.crash() || func.crash(player);
        player.kick(banMsg) || mc.runcmdEx(`kick "${res.player_name}" ${banMsg}`);
        logger.titleLog.warn("UniteBan", banMsg);
        mc.broadcast(banMsg);
    } catch (e) {
        func.titleLog.warn("UniteBan", e.toString())
    }
})



