const lib_list = Object.entries({ // 我不管 反正好看 看的舒服
    /**
     * === 核心类 ===
     * 核心机制，数据管理，或者框架实现
     * 底层逻辑，或者离线玩家/web什么的
     */
    Core: [
        "AIChat.js", // AI聊天相关
        "JoinTime.js", // 加入时间相关
        "Mail.js", // 邮件系统
        "UserBind.js", // 用户绑定
        "UserMigrate.js" // 帐号迁移
    ],

    /**
     * === 玩法类 ===
     * 玩法内容，涉及到个体玩家的东西
     * 单个玩家执行什么的
     */
    Game: [
        "BoxUI.js", // 箱子UI
        "CloudLift.js", // 云朵电梯
        "Doll.js", // 玩偶
        "EnderDragonEx.js", // 更凶猛的末影龙
        "OPmgr.js", // OP管理
        "SkinEffect.js" // 皮肤效果
    ],

    /**
     * === 世界类 ===
     * 世界/环境管理，全局什么的
     * 多个或全体在线玩家什么的
     */
    World: [
        "AfkTestfor.js", // 挂机检测
        "AxolotlDamage.js", // 美西螈攻击
        "Cdk.js", // 兑换码系统
        "ScoreChanged.js", // 积分榜提示
        "ShowBiome.js", // 群系提示
        "WorldBorder.js" // 世界边境
    ]
}).flatMap(([k, v]) => v.map(i => `./${k}/${i}`));

logger.setTitle("QYComponent");


logger.warn(`${lib_list.length} 个QYServer附加组件开始加载...`);
const startTime = Date.now();
lib_list.forEach(lib => {
    import(lib)
        .then(mod => {
            logger.info(`${lib} 加载完成(${((Date.now() - startTime) / 1000).toFixed(3)}s)`)
            checkProgress();
        })
        .catch(err => {
            logger.error(`组件 ${lib} 加载失败：\n      ${err}`);
            checkProgress();
        });
});

let loadedCount = 0;
function checkProgress() {
    loadedCount++;
    if (loadedCount == lib_list.length) {
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(3);
        logger.warn(`${loadedCount} 个附加组件在 (${totalTime}) 秒内启动完成`);
    }
}
logger.setTitle("Server");