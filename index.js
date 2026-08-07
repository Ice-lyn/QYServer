// import dts
/// <reference path="/root/Library/lse/index.d.ts" />
import * as func from "./src/lib/func.js";
import "./src/module/load.js";
import "./src/index.js";

// 导出接口
try {
    let load_ok = 0;
    Object.entries(func)
        .filter(([key]) => Object.prototype.hasOwnProperty.call(func, key))
        .forEach(([key, value]) => {
            if (typeof value === 'function') ll.exports(value, "QYServer", key) && load_ok++;
            else func.titleLog.warn("QYExports", `${key} 不是函数！跳过导出...`);
        });
    logger.setTitle("QYExports");
    logger.warn(`成功导出 ${load_ok} 个接口`);
    logger.setTitle("Server");
} catch (e) {
    logger.setTitle("QYExports");
    logger.error("QYServer 导出接口失败！\n", e);
    logger.setTitle("Server");
}

// 佛祖保佑佛祖保佑佛祖保佑佛祖保佑佛祖保佑
// 坚守在最底线的佛祖
// 佛祖一定要保佑啊啊啊啊啊啊啊
mc.listen("onServerStarted", () => {
    colorLog("yellow", "                      _ooOoo_                         ");
    colorLog("yellow", "                     o8888888o                        ");
    colorLog("yellow", "                     88\" . \"88                      ");
    colorLog("yellow", "                     (| ^_^ |)                        ");
    colorLog("yellow", "                     O\\  =  /O                       ");
    colorLog("yellow", "                  ____/`---'\\____                    ");
    colorLog("yellow", "                .'  \\\\|     |//  `.                 ");
    colorLog("yellow", "               /  \\\\|||  :  |||//  \\               ");
    colorLog("yellow", "              /  _||||| -:- |||||-  \\                ");
    colorLog("yellow", "              |   | \\\\\\  -  /// |   |              ");
    colorLog("yellow", "              | \\_|  ''\\---/''  |   |               ");
    colorLog("yellow", "              \\  .-\\__  `-`  ___/-. /               ");
    colorLog("yellow", "            ___`. .'  /--.--\\  `. . __               ");
    colorLog("yellow", "         .\"\" '<  `.___\\_<|>_/___.'  >'\"\".        ");
    colorLog("yellow", "        | | :  `- \\`.;`\\ _ /`;.`/ - ` : | |         ");
    colorLog("yellow", "        \\  \\ `-.   \\_ __\\ /__ _/   .-` /  /       ");
    colorLog("yellow", "   ======`-.____`-._____\\_____/___.-`____.-'======   ");
    colorLog("yellow", "                      `=---='                         ");
    colorLog("yellow", "   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^    ");
    colorLog("yellow", "              佛祖保佑        永无BUG                   ");
})