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
