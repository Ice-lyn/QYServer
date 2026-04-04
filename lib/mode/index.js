const lib_list = [
    // === 世界类 === //
    "./World/WorldBorder.js", // 世界边境
    "./World/AfkTestfor.js", // 挂机检测
    "./World/ItemRunCmd.js", // 物品运行命令
    "./World/ShowBiome.js", // 群系提示
    "./World/ScoreChanged.js", // 积分榜提示
    "./World/onPluginEvent.js", // 触发自定义事件
    // "./World/Accesskey.js", // 进服时密钥

     // === 玩法类 === //
    // "./Game/AIChat.js", // AI聊天相关
    "./Game/PlayerTime", // 加入时间相关
    "./Game/AxolotlDamage.js", // 美西螈攻击
    "./Game/BoxUI.js", // 箱子UI
    "./Game/SkinEffect.js", // 皮肤效果
    "./Game/CloudLift.js", // 云朵电梯
    "./Game/Mail.js", // 邮件系统
    "./Game/Doll.js" // 玩偶
]

logger.setTitle("Component")
logger.warn(`${lib_list.length} 个QYServer附加组件开始加载...`)
logger.setTitle("Server")

const startTime = Date.now()
lib_list.forEach(lib => {
    import(lib)
        .then(() => {
            logger.info(`${lib} 加载完成(${((Date.now() - startTime) / 1000).toFixed(3)}s)`)
            checkProgress();
        })
        .catch(err => {
            logger.error(`组件 ${lib} §r加载失败：\n   ${err}`);
            checkProgress();
        });
});

let loadedCount = 0
function checkProgress() {
    loadedCount++;
    if (loadedCount == lib_list.length) {
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(3);
        logger.setTitle("Component")
        logger.warn(`${loadedCount}个附加组件在 (${totalTime}) 秒内启动完成`)
        logger.setTitle("Server")
    }
}






