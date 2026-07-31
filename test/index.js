import axios from "axios";

(async () => {
    const data = (
        await axios.get("https://uniteban.megastudio.cn/api/check_ban.php", {
            params: {
                data: Buffer.from(JSON.stringify({
                    xuid: "player.xuid",
                    client_id: "device.clientId",
                    ip_address: "device.ip"
                })).toString('base64')
            },
            headers: {
                'Authorization': 'Bearer ',
                'Content-Type': 'application/json'
            },
            timeout: 50000
        })
    ).data;

    console.log(data)
})()