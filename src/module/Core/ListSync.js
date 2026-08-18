import { Minecraft } from '../../../../GMLIB-LegacyRemoteCallApi/lib/GMLIB_API-JS.js';
import { createClient } from "redis";

import config from "../../../Config/config.js";
import * as func from "../../lib/func.js";

const client = createClient(config.redis);
const listNameSet = new Set();

client.on("error", e => func.titleLog.warn("ListSync", "无法连接Java服务器数据库!", e));
client.connect(() => {
    setInterval(async () => {
        try {
            let names = [];
            const list = await client.sMembers("redisbungee::main::proxies::velocity-1::online-players");
            
            for (const uuid of list) {
                const name = JSON.parse((await client.hGet('uuid-cache', uuid)))?.name;
                if (listNameSet.has(name)) continue;
                addNameList(name);
                names.push(name);
            }

            // 去除不在远程列表内的
            listNameSet.forEach(name => {
                if (!names.includes(name))
                    delNameList(name);
            })
        } catch (e) {
            func.titleLog.warn("ListSync", e.toString())
        }
    }, 30 * 1000)
})

ll.onUnload(() => {
    if (Minecraft.removeAllFakeLists())
        return;

    listNameSet.forEach(name => {
        Minecraft.removeFakeList(name);
    });

    client.quit();
})

function addNameList(name, xuid = "0") {
    Minecraft.addFakeList(`JE-${name}`, xuid);
    listNameSet.add(name)
}

function delNameList(name) {
    Minecraft.removeFakeList(`JE-${name}`);
    listNameSet.delete(name);
}





