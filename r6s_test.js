require('dotenv').config()

const { Client, MessageEmbed } = require('discord.js');

const client = new Client();

client.login(process.env.BOT_TOKEN);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('Prefix: ç')
    .then(presence => console.log(`Activity set to ${presence.activities[0].name}`))
    .catch(console.error);
});

const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});
const R6API = require('r6api.js');
const r6api = new R6API(process.env.R6S_EMAIL, process.env.R6S_PASSWORD);

const platform = 'uplay';

let id;
let stats;
let weapons;

client.on('message', async msg => {
    if (msg.channel.name)
        console.log(`>In ${msg.guild.name}, #${msg.channel.name}: ${msg.author.username} said ${msg.content}`);
    else
        console.log(`>${msg.author.username} DM'd ${msg.content}`);
    if (msg.content[0] !== process.env.SYMBOL) {
        return;
    }
    let line = msg.content.substring(1).slice(0);
    line = line.trim();
    line = line.split(" ");

    switch (line[0].toUpperCase()) {
        case "WEAPON":
            if (line.length < 3) {
                msg.channel.send("not enough arguments");
                break;
            }
            try {
                const result = await retrieveWeapon(line[1], line[2].toUpperCase())
                let embed = new MessageEmbed()
                    .setTitle(result.name)
                    .setDescription(`Kills: ${result.kills}`);
                msg.channel.send(embed);
            }
            catch (err) {
                msg.channel.send(err);
            }
            break;
        case "STATS":
            if (line.length < 2) {
                msg.channel.send("not enough arguments");
                break;
            }
            try {
                const result = await retrieveStats(line[1])
                generalStatsEmbed(result, line[1], msg);
            }
            catch (err) {
                msg.channel.send(err);
            }
            break;
        case "TYPEKILL":
            if (line.length < 3) {
                msg.channel.send("not enough arguments");
                break;
            }
            try {
                const result = await retrieveTypeKills(line[1], line[2].toLowerCase())
                let embed = new MessageEmbed()
                    .setTitle(`${line[1]}'s kills with ${line[2].toUpperCase()}`)
                    .addField("Total", result.toString());
                msg.channel.send(embed);
            }
            catch (err) {
                msg.channel.send(err);
            }
            break;
        case "HELP":
            help(msg, line[1])
            break;
        case "STATUS":
            retrieveStatus(msg)
            break;
        case "OPERATOR":
            if(line.length < 3){
                msg.channel.send("not enough arguments")
                break;
            }
            if(line[2].toLowerCase() === "nökk") line[2] = "nokk"
            if(line[2].toLowerCase() === "jäger") line[2] = "jager"

            try{
                
                let operator = await retrieveOperator(line[1], line[2].toLowerCase())
                //console.log(operator)
                operatorStatsEmbed(operator, line[1], line[2].toLowerCase(), msg)
            }
            catch(err) {
                msg.channel.send(err)
            }
            break;
    }
});

async function retrieveWeapon(name, weapon) {
    let result;
    try {
        await loadUser(name)
    } catch (err) {
        throw err
    }
    weapons = stats.pvp.weapons;
    for (weaponType in weapons) {
        for (let i = 0; i < weapons[weaponType].list.length; i++) {
            if (weapons[weaponType].list[i].name.toUpperCase().replace(/\s/g, '') === weapon) {
                result = weapons[weaponType].list[i];
                break;
            }
        }
    }

    if (!result) {
        let error = "weapon not found";
        console.error(error);
        throw error;
    }

    return result;
}

async function loadUser(name) {
    try {
        const user = await r6api.getId(platform, name)

        if (!user[0])
            throw "User not found";
        id = user[0].userId

        stats = (await r6api.getStats(platform, id))[0];
        console.log("User Retrieved");

        return stats;
    }
    catch (err) {
        console.error(err)
        throw err;
    }
}

async function retrieveStats(name) {
    try {
        await loadUser(name)
    } catch (err) {
        throw err
    }

    return stats.pvp.general;
}

async function generalStatsEmbed(result, name, msg) {

    let embed = new MessageEmbed()
        .setTitle(`General Stats for ${name}`)
        .addField("Kills", result.kills, true)
        .addField("Deaths", result.deaths, true)
        .addField("K/D Ratio", (result.kills / result.deaths).toPrecision(3), true)
        .addField("Wins", result.wins, true)
        .addField("Losses", result.losses, true)
        .addField("Win %", ((result.wins / result.matches) * 100).toPrecision(4) + "%", true)

    msg.channel.send(embed);
}


async function retrieveTypeKills(name, weaponType) {
    try {
        await loadUser(name)
    } catch (err) {
        throw err
    }
    weapons = stats.pvp.weapons;


    if (!weapons[weaponType]) {
        throw "that type doesn't exist";
    }
    let sum = 0;
    for (gun of weapons[weaponType].list) {
        sum += gun.kills;
    }
    //console.log(sum);
    return sum;

}

async function help(msg, command) {
    let user = "Mornis";
    let embed = new MessageEmbed();
    if(!command){
        embed.setTitle(`Help:`);
        embed.setDescription("Prefix: `ç` \n\
        This bot is made to work only with PC servers. Console players will not be able to use it properly. \n\
        For more information about a specific command type `çHelp command`");
        embed.addField("**Commands:**", "`weapon` \n `stats` \n `typekill` \n `status` \n `operator` \n");
    }else if(command.toUpperCase() === "WEAPON"){
        /*let assaultString = "`" + (await getWeapons(user, "assault")).join("`, `") + "`";
        let smgString = "`" + (await getWeapons(user, "smg")).join("`, `") + "`";
        let lmgString = "`" + (await getWeapons(user, "lmg")).join("`, `") + "`";
        let marksmanString = "`" + (await getWeapons(user, "marksman")).join("`, `") + "`";
        let pistolString = "`" + (await getWeapons(user, "pistol")).join("`, `") + "`";
        let shotgunString = "`" + (await getWeapons(user, "shotgun")).join("`, `") + "`";
        let mpString = "`" + (await getWeapons(user, "mp")).join("`, `") + "`";*/
        embed.setTitle(`WEAPON`);
        embed.setDescription("This command shows the amount of kills you got with the specified weapon.\n\n\
        The use is as follows: `çWeapon *nickname* *weapon*`\n\
        **Important: The weapon names need to be written without spaces** \n\
        These are the available weapons for this command:")
        embed.addField("Assault Rifles","`L85A2` \n `F2` \n `416-C CARBINE` \n `R4-C` \n `556XI` \n `Type-89` \n `552 Commando` \n `PARA-308` \n `AR33` \n `G36C` \n `C8-SFW` \n `M4` \n `M762` \n `C7E` \n `AK-12` \n `MK17 CQB` \n `AUG A2` \n `v308` \n `AK-74M` \n `Commando 9` \n `AR-15.50` \n `F90` \n `ARX200` \n `SPEAR .308`", true)        
        embed.addField("SMGs","`MPX` \n `MP7` \n `MP5` \n `UMP45` \n `Vector .45 ACP` \n `M12` \n `SMG-12` \n `Scorpion EVO 3 A1` \n `MP5K` \n `9x19VSN` \n `P90` \n `K1A` \n `9mm C1` \n `Mx4 Storm` \n `T-5 SMG` \n `MP5SD` \n `FMG-9` \n `AUG A3` \n `PDW9` \n `P10 RONI`", true)        
        embed.addField("Pistols","`M45 MEUSOC` \n `P12` \n `LFP586` \n `P226 MK 25` \n `D-50` \n `P9` \n `PRB92` \n `MK1 9mm` \n `GSH-18` \n `PMM` \n `RG15` \n `Keratos .357` \n `Q-929` \n `.44 Mag Semi-Auto` \n `5.7 USG` \n `P229` \n `USP40` \n `SDP 9mm` \n `P-10C` \n `Bailif 410` \n `1911 TACOPS`", true)        
        embed.addField("LMGs","`ALDA 5.56` \n `G8A1` \n `6P41` \n `T-95 LSW` \n `LMG-E` \n `M249` \n `M249 SAW`", true)        
        embed.addField("Marksman Rifles","`OTs-03` \n `CAMRS` \n `Mk 14 EBR` \n `417` \n `SR-25` \n `CSRX 300`", true)         
        embed.addField("Shotguns","`M590A1` \n `ITA12S` \n `M1014` \n `M870` \n `Super 90` \n `Supernova` \n `SPAS-15` \n `SG-CQB` \n `SIX12` \n `SASG-12` \n `BOSG.12.2` \n `SPAS-12` \n `Super Shorty` \n `SIX12 SD` \n `FO-12` \n `ITA12L` \n `ACS12` \n `TCSG12`", true)
        embed.addField("MPs","`SMG-11` \n `Bearing 9` \n `SPSMG9` \n `C75 Auto`", true)
        /*embed.addField("Assault Rifles:", assaultString)
        embed.addField("SMGs:", smgString)
        embed.addField("Pistols", pistolString)
        embed.addField("LMGs", lmgString)
        embed.addField("Marksman Rifles", marksmanString)
        embed.addField("Shotguns", shotgunString)
        embed.addField("MPs", mpString)*/
    }else if(command.toUpperCase() === "STATS"){
        embed.setTitle(`STATS`);
        embed.setDescription("This command shows your stats, like the amount of total kills you got.\n\n\
        The use is as follows: `çStats *nickname*`")
    }else if(command.toUpperCase() === "TYPEKILL"){
        embed.setTitle(`TYPEKILL`);
        embed.setDescription("This command shows you the amount of kills you got with a specific weapon type.\n\n\
        The use is as follows: `çTypekill *nickname* *weapon type*`")
        embed.addField("**Defined weapon types:**","`Assault` \n `SMG` \n `LMG` \n `Marksman` \n `Pistol` \n `Shotgun` \n `MP`")
    }else if(command.toUpperCase() === "STATUS"){
        embed.setTitle(`STATUS`)
        embed.setDescription("This command shows you whether the PC servers are online or offline \n\
        The use is as follows: `çStatus`")
    }else if(command.toUpperCase() === "OPERATOR"){
        let string = "`" + (await getOperators(user)).join("`, `") + "`"
        embed.setTitle(`OPERATOR`)
        embed.setDescription("This command shows you your stats with a specific operator.\n\n\
        The use is as follows: `çOperator *nickname* *operator*`")
        embed.addField("**Defined operators:**",string, true)
    }else{
        msg.channel.send("Unknown command");
    }

    msg.channel.send(embed);
}



async function retrieveStatus(msg){
    let result = await r6api.getStatus();
    let embed = new MessageEmbed()
        .setTitle("Server Status for PC")
        .setDescription(`The servers are currently ${result.PC.Status}`);
    msg.channel.send(embed);
}

async function retrieveOperator(name, operator){
    try {
        await loadUser(name)
    } catch (err) {
        throw err
    }
    operators = stats.pvp.operators;
    //console.log(operators)
    if (!operators[operator]) {
        throw "that operator doesn't exist";
    }
    
    //console.log(sum);
    return operators;
}

async function operatorStatsEmbed(result, username, operator, msg) {
    
    let embed = new MessageEmbed()
        .setTitle(`${result[operator].name} stats for ${username}`)
        .setImage(result[operator].badge)
        .addField("Kills", result[operator].kills, true)
        .addField("Deaths", result[operator].deaths, true)
        .addField("K/D Ratio", (result[operator].kills / result[operator].deaths).toPrecision(3), true)
        .addField("Wins", result[operator].wins, true)
        .addField("Losses", result[operator].losses, true)
        .addField("Win %", ((result[operator].wins / (result[operator].wins + result[operator].losses)) * 100).toPrecision(4) + "%", true)

    msg.channel.send(embed);
}

async function getOperators(user){
    try {
        await loadUser(user)
    } catch (err) {
        throw err;
    }
    operators = stats.pvp.operators
    let keys = []
    for(let key in operators){
        keys.push(key)
    }
    return keys;
}

async function getWeapons(user, weaponType){
    try {
        await loadUser(user)
    } catch (err) {
        throw err;
    }
    weapons = stats.pvp.weapons[weaponType]
    let keys = []
    for (key in weapons.name){
        keys.push(key);
    }
    return keys;
}