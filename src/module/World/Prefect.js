import { config } from "../../../Config/config.js";
import * as func from "../../lib/func.js";

const kickPlayerSet = new Set();
const mutePlayerSet = new Set();
const prefectList = {
    xuids: Object.keys(config.prefect),
    names: Object.values(config.prefect).map(i => i.name),
    emails: Object.values(config.prefect).map(i => i.email)
}
/**
 * 风纪委员管理系统
 * 
 * TODO：
 * - 权限分层
 *   - 初级：只有提案/投票权，所有人可用
 *   - 中级：在上面的基础上增加处罚权和广播权
 *   - 高级：管理、腐竹，拥有服务器控制权
 * 
 * - 功能设计
 *   - 初级：举报/投票踢人
 *   - 中级：禁言/踢出
 *   - 高级：永久ban/设置世界访问权限
 */

// 禁言持久逻辑
mc.listen("onJoin", (player) => {
    if (!player || !player.inWorld) return;

    if (kickPlayerSet.has(player?.realName || player.name))
        return player.kick();

    if (mutePlayerSet.has(player?.realName))
        return mc.runcmdEx(`ability "${player.realName}" mute true`);
})

// CMD 注册
func.addOnmodeCmd("prefect", (player) => {
    if (config.prefect[player?.xuid] && false)
        prefectAdmin(player);
    else
        prefectUser(player);
    // 高级用户不做判断
    // 高级用户去后台操作
})

// 初级权限
function prefectUser(player) {
    player.sendSimpleForm(
        "QYServer 社区风纪管理",
        `你好 ${player.realName}!\n今天想为社区风气做点什么？`,
        ["举报玩家", "投票踢人"],
        ["textures/blocks/ha", "textures/blocks/dai"],
        (player, id) => {
            if (func.isNull(id)) return;

            switch (id) {
                case 0:
                    report(player);
                    break;

                case 1:
                    voteKick(player);
                    break;

            }
        }
    )
}

// 中级权限
function prefectAdmin(player) {
    player.sendSimpleForm(
        "QYServer 社区风纪管理",
        `你好 ${player.realName}!\n今天想为社区风气做点什么？`,
        ["举报玩家", "投票踢人", "强制踢出", "禁言玩家"],
        ["textures/blocks/ha", "textures/blocks/dai", "textures/ui/sky/none", "textures/ui/sky/block"],
        (player, id) => {
            if (func.isNull(id)) return;

            switch (id) {
                case 0:
                    report(player);
                    break;

                case 1:
                    voteKick(player);
                    break;

                case 2: {
                    sendPlayerSelection(player,
                        "强制踢人",
                        "选择一个玩家",
                        [],
                        (fm) => fm.addInput("踢出原因"),
                        (name, data) => {
                            kickPlayerSet.add(name);
                            setTimeout(() => kickPlayerSet.delete(name), 10 * 60 * 1000);

                            const cmd = `kick "${name}" 你已被社区风纪踢出！\n${data[1]}`;
                            mc.broadcast(`社区风纪 ${player.realName} 将 ${name} 踢出10分钟: ${data[1]}`)
                            func.titleLog.warn("Kick", `${player.realName} -> ${cmd}`);
                            ll.imports("BehaviorLog_WriteLog")("社区风纪-踢人", player.pos.dimid, player.realName, player.pos.x, player.pos.y, player.pos.z, "", "", "", "", cmd, false, true);
                            mc.runcmd(cmd)
                        }
                    )
                    break;
                }

                case 3: {
                    sendPlayerSelection(player,
                        "禁言玩家",
                        "选择一个玩家",
                        [],
                        () => { },
                        (name, data) => {
                            mutePlayerSet.add(name);
                            setTimeout(() => {
                                mutePlayerSet.delete(name);
                                mc.runcmd(`ability "${name}" mute false`);
                            }, 10 * 60 * 1000);

                            mc.runcmd(`ability "${name}" mute true`);
                            mc.broadcast(`社区风纪 ${player.realName} 将 ${name} 禁言10分钟`);
                            ll.imports("BehaviorLog_WriteLog")("社区风纪-禁言", player.pos.dimid, player.realName, player.pos.x, player.pos.y, player.pos.z, "", "", "", "", `禁言玩家: ${name}`, false, true);
                        }
                    )
                    break;
                }
            }
        })
}

// === 功能 === //

let votePlayer = [];
let voteKickObj = {};
let is_vote = false;

// 投票踢人
function voteKick(player) {
    if (mc.getOnlinePlayers().length <= 5)
        return player.tell("人数不够5人，无法投票...");

    if (votePlayer.includes(player.xuid))
        return player.tell("你不能重复投票！")

    sendPlayerSelection(player,
        "投票踢人",
        "要票出的玩家",
        [],
        () => { },
        (name) => {
            voteKickObj[name] = (voteKickObj[name] || 0) + 1;
            player.tell(`已对 ${name} 进行投票！\n对方当前票数：${voteKickObj[name]}`);
            votePlayer.push(player.xuid);
            if (!is_vote) {
                mc.broadcast("投票踢人已开启，将在120秒后进行统计并处理");
                setTimeout(() => {
                    const banName = Object.entries(voteKick)
                        .filter(([_, v]) => v > 3)
                        .sort((a, b) => b[1] - a[1])[0];

                    if (func.isNull(banName))
                        mc.broadcast("今晚没有人被票出...");
                    else
                        mc.broadcast(mc.runcmdEx(`kick "${banName}" 你已被投票踢出...`).output);

                    kickPlayerSet.add(name);
                    setTimeout(() => kickPlayerSet.delete(banName), 10 * 60 * 1000)
                    is_vote = false;
                    votePlayer = [];
                    voteKickObj = {};
                }, 120 * 1000)
            }
        }
    )
}

// 举报玩家
function report(player) {
    sendPlayerSelection(player,
        "举报玩家",
        "在",
        ["不在线"],
        (fm) => fm.addInput("举报原因", "他对你做了什么？越详细越好"),
        (name, data) => {
            const msg = [
                `${player.realName} 发送举报`,
                `- 举报时间：${system.getTimeStr()}`,
                `- 举报对象：${name}`,
                `- 举报坐标：${player.pos}`,
                `- 举报原因：${data[1]}`
            ].join("\n");

            mc.getOnlinePlayers()
                .filter(player => prefectList.xuids.includes(player.xuid))
                .forEach(player => {
                    player.tell(msg);
                    player.sendSimpleForm(
                        "收到举报",
                        "收到一条举报信息，请及时处理！\n\n" + msg,
                        [], [], () => { }
                    )
                });
            func.titleLog.warn("Prefect", msg);
            func.sendMail({
                from: '"issues" <admin@m.qyserver.cc>',
                to: prefectList.emails,
                subject: "QYServer | 举报",
                text: msg
            }, (info, isSend) => {
                isSend
                    ? player.tell("举报邮件已发送！")
                    : logger.error(info);
            })
        }
    )
}

// === 辅助函数 === //

// 向玩家发送玩家选择表单
function sendPlayerSelection(player, title, msg, list = [], fmadd = (() => { }), callback = (() => { })) {
    const allPlayers = [...list, ...mc.getOnlinePlayers().map(i => i.realName)];
    const fm = mc.newCustomForm()
        .setTitle(title)
        .addDropdown(msg, allPlayers);
    fmadd(fm);

    player.sendForm(fm, (player, data) => {
        if (func.isNull(data)) return;
        callback(allPlayers[data[0]], data)
    })
}