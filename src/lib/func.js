import config from "../Config/config.js";

/**
 * 判断是否有权限在领地内操作
 * @param {Player} Player 玩家对象
 * @param {IntPos} Pos 方块的坐标对象
 * @returns {Boolean} - 返回是否有权限
 */
export function LandJudgment(Player, Pos) {
    const toRawPos = (Pos) => ({
        'x': Pos.x,
        'y': Pos.y,
        'z': Pos.z,
        'dimid': Pos.dimid
    });
    if (ll.hasExported('ILAPI_PosGetLand')) {// iLand
        /** 领地ID @type {Number} */
        let LandId = ll.imports('ILAPI_PosGetLand')(toRawPos(Pos));
        if (LandId != -1 &&
            !(
                ll.imports('ILAPI_IsLandOwner')(LandId, Player.xuid)// 领地主人
                || ll.imports('ILAPI_IsLandOperator')(Player.xuid)// 领地管理
                || ll.imports('ILAPI_IsPlayerTrusted')(LandId, Player.xuid)// 被信任的
            )
        ) return false;
    }
    return true;
}

/**
 * 获取聊天称号
 * @param {Player} player - 目标玩家对象
 * @return {string} - 返回称号字符串
 */
export function getChatTag(player) {
    const tag = player.getNbt()// 从USF数据里获取
        .getTag("DynamicProperties")
        .getTag("9472c503-5a92-43c8-7ddf-0492de2362d7")
        .getData("usfV2:chat_tag");
    return tag || "§e萌§a新§b求§d带§r";
}

/**
 * 崩溃玩家客户端
 * @param {Player} player - 目标玩家对象
 */
export function crash(player) {
    const pack = new BinaryStream()
    pack.writeVarInt64(Number(player.uniqueId))
    player.sendPacket(pack.createPacket(0x0E))
    setTimeout(() => {// 如果玩家没有被崩掉，就直接踢
        player?.despawn() || player?.kick("服务器发送了破损的数据包")
    }, 100)
    logger.warn(`向 ${player.realName} 发送客户端崩溃请求...`)
}

/**
 * 文件大小格式化函数
 * @param {number} bytes - 文件大小的字节数
 * @param {number} mode - 输入单位模式 (0:B, 1:KB, 2:MB, 3:GB)
 * @returns {string} - 格式化后的文件大小字符串（自动选择合适单位）
 */
export function getFileSize(bytes, mode = 0) {
    const bytesValue = bytes * 1024 ** mode;
    const units = ["B", "KB", "MB", "GB"];
    const unitIndex = Math.min(3, Math.floor(Math.log2(bytesValue) / 10));
    return (bytesValue / 1024 ** unitIndex).toFixed(2) + " " + units[unitIndex];
}

/**
 * 秒数格式化函数
 * @param {number} seconds - 要格式化的秒数
 * @returns {string} - 格式化后的时间字符串
 */
export function formatSeconds(seconds) {
    const units = [
        { value: 86400, label: '天' },
        { value: 3600, label: '小时' },
        { value: 60, label: '分钟' },
        { value: 1, label: '秒' }
    ];
    let result = '';
    units.forEach(({ value, label }) => {
        if (seconds >= value) {
            const count = Math.floor(seconds / value);
            result += `${count}${label} `;
            seconds %= value;
        }
    })
    return result.trim() || '0秒';
}

/**
 * 随机打乱字符串
 * @param {string} str - 要打乱的字符串
 * @returns {string} 返回打乱后的字符串
 */
export function shuffleString(str) {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
}

/**
 * 概率判断函数
 * @param {number} percent - 触发概率百分比，范围 0-100
 * @returns {boolean} 是否触发概率事件
 */
export function probability(percent) {
    return Math.random() * 100 < Math.max(0, Math.min(100, percent))
}

/**
 * 去除一段字符串内所有§颜色代码
 * @param {string} text - 原始文本
 * return {string} 返回去除后的文本
 */
export function delStringCode(text) {
    return text.replace(/§./g, '')
}

/**
 * 表情替换函数
 * @param {string} msg - 需要过滤的原始消息文本
 * @param {number} mode - 替换模式 0:emoji转特殊表情 1:特殊表情转emoji
 * @returns {string} - 过滤替换后的消息文本
 */
export function textToEmoji(msg, mode = 0) {
    const words = Array.from(config.replaceMap.keys()).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(words.join('|'), 'gi');
    return mode === 0
        ? msg.replace(regex, m => config.replaceMap.get(m.toLowerCase()) || m)
        : msg.replace(regex, m => Array.from(config.replaceMap).find(([k, v]) => v === m)?.[0] || m);
}

/**
 * 空值检查函数
 * @param {*} enter - 需要检查的输入值
 * @returns {boolean} - 如果值为null或undefined则返回true，否则返回false
 */
export function isNull(enter) {
    if (enter === null) return true
    if (enter === undefined) return true
    return false
}

/**
 * 创建标题日志记录器对象
 * @returns {Object} - 返回包含info、warn、error、debug四个方法的日志对象
 * 
 * 返回值说明：
 * - info(title, ...data): 以指定标题输出info级别日志
 * - warn(title, ...data): 以指定标题输出warn级别日志  
 * - error(title, ...data): 以指定标题输出error级别日志
 * - debug(title, ...data): 以指定标题输出debug级别日志
 */
export const titleLog = {
    info: ((title, ...data) => {
        logger.setTitle(title);
        logger.info(data);
        logger.setTitle("Server");
    }),
    warn: ((title, ...data) => {
        logger.setTitle(title);
        logger.warn(data);
        logger.setTitle("Server");
    }),
    error: ((title, ...data) => {
        logger.setTitle(title);
        logger.error(data);
        logger.setTitle("Server");
    }),
    debug: ((title, ...data) => {
        logger.setTitle(title);
        logger.debug(data);
        logger.setTitle("Server");
    })
}


/**
 * 为实体执行Minecraft命令
 * @param {Entity} entity - 要执行命令的实体对象
 * @param {string} cmd - 要执行的Minecraft命令
 * @returns {boolean} - 命令执行结果，失败返回false
 */
export function enRuncmd(entity, cmd) {
    if (entity === null) return false;
    if (entity.isPlayer()) return mc.runcmdEx(`execute as "${entity.toPlayer().realName}" at @s run ${cmd}`);

    entity.addTag(`qys:runcmd_${entity.uniqueId}`); // 使用唯一ID做判断
    setTimeout(() => entity?.removeTag(`qys:runcmd_${entity?.uniqueId}`), 5);
    return mc.runcmdEx(`execute as @e[tag="qys:runcmd_${entity.uniqueId}"] at @s run ${cmd}`);
}

/**
 * Minecraft格式代码与ANSI颜色代码相互转换函数
 * @param {string} text - 需要转换的文本
 * @param {number} [mode=0] - 转换模式：0-Minecraft代码转ANSI，1-ANSI转Minecraft代码
 * @returns {string} - 转换后的文本
 * 
 * 转换对应关系：
 * - §0-§f ↔ 对应的ANSI颜色代码（如§0 → 黑色，§a → 亮绿色等）
 * - §l(粗体) ↔ \x1b[1m
 * - §o(斜体) ↔ \x1b[3m
 * - §n(下划线) ↔ \x1b[4m
 * - §m(删除线) ↔ \x1b[9m
 * - §r(重置) ↔ \x1b[0m
 * - §k(随机字符)在Minecraft→ANSI转换时被忽略
 * 
 * 注意：支持ANSI组合代码（如\x1b[1;34m）的解析和转换
 */
export function mcCode2Ansi(text, mode = 0) {
    if (mode === 0) { // MC → ANSI
        const mc2ansi = {
            '§0': '\x1b[30m', '§1': '\x1b[34m', '§2': '\x1b[32m', '§3': '\x1b[36m',
            '§4': '\x1b[31m', '§5': '\x1b[35m', '§6': '\x1b[33m', '§7': '\x1b[37m',
            '§8': '\x1b[90m', '§9': '\x1b[94m', '§a': '\x1b[92m', '§b': '\x1b[96m',
            '§c': '\x1b[91m', '§d': '\x1b[95m', '§e': '\x1b[93m', '§f': '\x1b[97m',
            '§l': '\x1b[1m', '§o': '\x1b[3m', '§n': '\x1b[4m', '§m': '\x1b[9m',
            '§r': '\x1b[0m'
        };
        // §k直接跳过，其他未定义的也跳过
        return text.replace(/§[0-9a-fk-or]/gi, match => mc2ansi[match.toLowerCase()] || '');
    } else { // ANSI → MC
        const ansi2mc = {
            '\x1b[30m': '§0', '\x1b[34m': '§1', '\x1b[32m': '§2', '\x1b[36m': '§3',
            '\x1b[31m': '§4', '\x1b[35m': '§5', '\x1b[33m': '§6', '\x1b[37m': '§7',
            '\x1b[90m': '§8', '\x1b[94m': '§9', '\x1b[92m': '§a', '\x1b[96m': '§b',
            '\x1b[91m': '§c', '\x1b[95m': '§d', '\x1b[93m': '§e', '\x1b[97m': '§f',
            '\x1b[1m': '§l', '\x1b[3m': '§o', '\x1b[4m': '§n', '\x1b[9m': '§m',
            '\x1b[0m': '§r'
        };
        // 处理组合代码如\x1b[1;34m
        return text.replace(/\x1b\[([0-9;]+)m/g, (full, codes) => {
            const mcCodes = codes.split(';').map(code => {
                const key = `\x1b[${code}m`;
                return ansi2mc[key] || '';
            }).join('');
            return mcCodes;
        });
    }
}

/**
 * 带超时倒计时的跨服传送函数
 * @param {Player} player - 要传送的玩家对象
 * @param {string} ip - 目标服务器IP地址
 * @param {number|string} port - 目标服务器端口号
 * @param {number} timeout - 倒计时秒数
 * @param {Function} [err] - 传送失败时的回调函数，参数为玩家对象，默认为提示切换失败
 * 
 * 功能说明：
 * - 从timeout秒开始倒计时，每秒向玩家发送提示信息
 * - 倒计时结束时执行跨服传送操作
 * - 如果传送失败，执行err回调函数
 * 
 * 注意：
 * - 函数不会阻塞执行，倒计时通过setTimeout异步进行
 * - 传送失败回调默认发送"[TPServer] 切换失败，请联系op"
 */
export function timeoutJoinServer(player, ip, port, timeout, err = (pl) => pl.tell("[TPServer] 切换失败，请联系op")) {
    const timeoutList = [];
    for (let i = timeout; i >= 0; i--) timeoutList.push(i)
    timeoutList.forEach((sec, index) => {
        setTimeout(() => {
            player.tell(`[TPServer] 正在将您您切换至其他服务器，剩余 §a${sec}§r 秒`)
            if (sec === 1) player.transServer(`${ip}`, Number(port)) || err(player)
        }, (index + 1) * 1000)
    })
}
