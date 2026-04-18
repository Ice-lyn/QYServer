const lib_list = Object.entries({ // 这样显得更好看 并且更容易维护

    // === 世界类 === //
    World: [
        "WorldBorder.js", // 世界边境
        "AfkTestfor.js", // 挂机检测
        "ItemRunCmd.js", // 物品运行命令
        "ShowBiome.js", // 群系提示
        "ScoreChanged.js", // 积分榜提示
        "JoinTime.js", // 加入时间相关
    ],

    // === 玩法类 === //
    Game: [
        "AIChat.js", // AI聊天相关
        "AxolotlDamage.js", // 美西螈攻击
        "BoxUI.js", // 箱子UI
        "SkinEffect.js", // 皮肤效果
        "CloudLift.js", // 云朵电梯
        "Mail.js", // 邮件系统
        "Doll.js" // 玩偶
    ]
}).flatMap(([k, v]) => v.map(i => `./${k}/${i}`));

logger.setTitle("Component");
logger.warn(`${lib_list.length} 个QYServer附加组件开始加载...`);
logger.setTitle("Server");

const startTime = Date.now();
lib_list.forEach(lib => {
    import(lib)
        .then(() => {
            logger.info(`${lib} 加载完成(${((Date.now() - startTime) / 1000).toFixed(3)}s)`)
            checkProgress();
        })
        .catch(err => {
            logger.error(`组件 ${lib} 加载失败：\n   ${err}`);
            checkProgress();
        });
});

let loadedCount = 0;
function checkProgress() {
    loadedCount++;
    if (loadedCount == lib_list.length) {
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(3);
        logger.setTitle("Component");
        logger.warn(`${loadedCount}个附加组件在 (${totalTime}) 秒内启动完成`);
        logger.setTitle("Server");
    }
}






