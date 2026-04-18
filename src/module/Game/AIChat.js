import * as func from "../../lib/func.js";
const token = "UUkR4A3CJNfW";

mc.listen("onChat", (player, msg) => {
    if (msg[0] !== "+"
        && ["ai", "服务", "妈", "操"].some(i => msg.includes(i))
    ) aiChatServer(msg, player);
})

function aiChatServer(text, plName = null) {
    const systemInfo = [
        "你是一个可爱的服务器娘,一位玩家触发了对话,选择性回答,字数任意但建议少,表情请使用颜文字,除反馈外不要使用换行和^符号",
        "判断本次对话是否需要回答,如不需要请只返回\"falseChat\",如需要请直接返回要说的话",
        "尽量以温暖的回答回应,如果有需要可以引导玩家去找服主和管理姐姐,谢谢你♡",
        "如果你需要反馈问题,请在结尾换行并输入\"issues 问题\",换行内容不会发送给玩家",
        "所有请求请在本次对话中完成,我们很抱歉,你是没有记忆的,每次对话都是新的开始QwQ",
        "如果玩家要东西直接拒绝",
        `${plName === null ? "" : `本次对话发送人(玩家名称): ${plName} ||`}接下来是消息原文`,
    ].join("\n")
    network.httpPost("https://yunzhiapi.cn/API/doubao.php", {},
        `token=${token}&system=${systemInfo}&question=${func.textToEmoji(text, 1)}`,
        "application/x-www-form-urlencoded",
        (code, res) => {
            if (code !== 200) return; // res = `接口请求时发生错误，code: ${code} | res：${res}`
            if (res === "falseChat") return log("AIChat 认为不需要回答，发言已取消");
            if (res.split("\n")[1]?.startsWith("issues ")) mc.runcmdEx(res.split("\n")[1]);

            mc.runcmd(`say ${res.split("\n")[0].replace(/[`^$&\\]/g, '')}`);
            func.titleLog("AIChat", func.textToEmoji(res));
        });
}