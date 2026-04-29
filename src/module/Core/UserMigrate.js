import * as func from "../../lib/func.js";

const userMigrate = {
    mc: (oldName, newName) => {
        const oldUuld = data.name2uuid(oldName);
        const newUuld = data.name2uuid(newName);

        if (!oldUuld && !newUuld) return false;

        // === NBT === //
        const oldNbt = mc.getPlayerNbt(oldUuld);
        mc.setPlayerNbt(oldUuld, mc.getPlayerNbt(newUuld));
        mc.setPlayerNbt(newUuld, oldNbt);
    },

    iland: (oldName, newName) => { // 合并领地，上面辣个是不会合并nbt才交换的
        if (!ll.hasExported("ILAPI_PosGetLand")) return false;

        const oldXuid = data.name2xuid(oldName);
        const newXuid = data.name2xuid(newName);

        if (!oldXuid && !newXuid) return false;

        // 先捕获，然后调用，性能可能更好（？
        const iland = {
            addTrust: ll.imports("ILAPI_AddTrust"),
            delTrust: ll.imports("ILAPI_RemoveTrust"),
            setOwner: ll.imports("ILAPI_SetOwner")
        };

        // 受信任的
        ll.imports("ILAPI_GetAllTrustedLand")(oldXuid).forEach((landId) => {
            iland.addTrust(landId, newXuid);
            iland.delTrust(landId, oldXuid);
        });

        // 拥有领地
        const oldLands = ll.imports("ILAPI_GetPlayerLands")(oldXuid);

        ll.imports("ILAPI_GetPlayerLands")(newXuid).forEach((id) => {
            iland.setOwner(id, oldXuid);
        });

        oldLands.forEach((id) => {
            iland.setOwner(id, newXuid);
        });
    }
}

events.on("onModeCallback", (player, cmd) => {
    if (cmd[0] !== "migrate") return;
    migrateUI(player);
    return true;
});

function migrateUI(player) {
    const fm = mc.newSimpleForm()
        .setTitle("迁移账户")
        .addInput("请输入您的完整旧账户名：");

    player.sendForm(fm, (player, id) => {
        if (func.isNull(id)) return player.tell("输入错误，请重新输入");
        const oldPlayer = data.name2xuid(id[0]) ?? null;
        const playerMail = JSON.parse(
            func.globalMap
                .get("Core::UserBind::playerKey")
                .get(oldPlayer) ?? null
        )?.email || null;

        if (oldPlayer === null) return player.tell("旧账户不存在，请重新输入!");
        if (playerMail === null) return player.tell("旧账户没有绑定邮箱，请联系管理员手动迁移");


    })
}
