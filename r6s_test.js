require('dotenv').config()

const { Client, MessageEmbed } = require('discord.js');

const client = new Client();

client.login(process.env.BOT_TOKEN);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity(`Rainbow Six Siege | Prefix: ${process.env.SYMBOL}`)
        .then(presence => console.log(`Activity set to ${presence.activities[0].name}`))
        .catch(console.error);
});

/*const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});*/

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
            if (line.length < 3) {
                msg.channel.send("not enough arguments")
                break;
            }
            if (line[2].toLowerCase() === "nökk") line[2] = "nokk"
            if (line[2].toLowerCase() === "jäger") line[2] = "jager"

            try {

                let operator = await retrieveOperator(line[1], line[2].toLowerCase())
                operatorStatsEmbed(operator, line[1], line[2].toLowerCase(), msg)
            }
            catch (err) {
                msg.channel.send(err)
            }
            break;
        case "COMPARE":
            if (line.length < 3) {
                msg.channel.send("not enough arguments");
                break;
            }
            try {
                const statsA = await retrieveStats(line[1])
                const statsB = await retrieveStats(line[2])

                compareStatsEmbed(statsA, statsB, line[1], line[2], msg)
            }
            catch (err) {
                msg.channel.send(err);
            }


            break;
    }
});

async function UpperCaseFirstLetter(string){
    let result = string[0].toUpperCase() + string.slice(1)

    return result
}

async function retrieveWeapon(name, lookingfor) {
    let result;
    try {
        await loadUser(name)
    } catch (err) {
        throw err
    }
    weapons = stats.pvp.weapons;
    for (weaponType in weapons) {
        for (let weapon of weapons[weaponType].list) {
            if (weapon.name.toUpperCase().replace(/\s/g, '') === lookingfor) {
                result = weapon
                break
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
    let user = await UpperCaseFirstLetter(name)
    let embed = new MessageEmbed()
        .setTitle(`General Stats for ${user}`)
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
        throw "that category doesn't exist";
    }
    let sum = 0;
    for (weapon of weapons[weaponType].list) {
        sum += weapon.kills;
    }
    return sum;

}

async function help(msg, command) {

    let embed = new MessageEmbed();
    if (!command) {

        embed.setTitle(`Help:`);
        embed.setDescription("Prefix: `ç` \n\
        This bot is made to work only with PC servers. Console players will not be able to use it properly. \n\
        For more information about a specific command type `çHelp command`");
        embed.addField("**Commands:**", "`weapon` \n `stats` \n `typekill` \n `status` \n `operator` \n `compare` \n");

    } else if (command.toUpperCase() === "WEAPON") {

        embed.setTitle(`WEAPON`);
        embed.setDescription("This command shows the amount of kills you got with the specified weapon.\n\n\
        The use is as follows: `çWeapon *nickname* *weapon*`\n\
        **Important: The weapon names need to be written without spaces** \n\
        These are the available weapons for this command:")

        embed.addField("Assault Rifles:", await getWeapons("assault"), true)
        embed.addField("SMGs:", await getWeapons("smg"), true)
        embed.addField("Pistols", await getWeapons("pistol"), true)
        embed.addField("LMGs", await getWeapons("lmg"), true)
        embed.addField("Marksman Rifles", await getWeapons("marksman"), true)
        embed.addField("Shotguns", await getWeapons("shotgun"), true)
        embed.addField("MPs", await getWeapons("mp"), true)

    } else if (command.toUpperCase() === "STATS") {

        embed.setTitle(`STATS`);
        embed.setDescription("This command shows your stats, like the amount of total kills you got.\n\n\
        The use is as follows: `çStats *nickname*`")

    } else if (command.toUpperCase() === "TYPEKILL") {

        embed.setTitle(`TYPEKILL`);
        embed.setDescription("This command shows you the amount of kills you got with a specific weapon type.\n\n\
        The use is as follows: `çTypekill *nickname* *weapon type*`")
        embed.addField("**Defined weapon types:**", "`Assault` \n `SMG` \n `LMG` \n `Marksman` \n `Pistol` \n `Shotgun` \n `MP`")

    } else if (command.toUpperCase() === "STATUS") {

        embed.setTitle(`STATUS`)
        embed.setDescription("This command shows you whether the PC servers are online or offline \n\
        The use is as follows: `çStatus`")

    } else if (command.toUpperCase() === "OPERATOR") {

        let string = "`" + (await getOperators()).join("`, `") + "`"

        embed.setTitle(`OPERATOR`)
        embed.setDescription("This command shows you your stats with a specific operator.\n\n\
        The use is as follows: `çOperator *nickname* *operator*`")
        embed.addField("**Defined operators:**", string, true)

    } else if (command.toUpperCase() === "COMPARE") { 

        embed.setTitle(`COMPARE`)
        embed.setDescription("This command lets you easily compare 2 players' stats \n\
        The use is as follows: `çCompare *user1* *user2*`")

    }else {

        msg.channel.send("Unknown command");

    }

    msg.channel.send(embed);
}



async function retrieveStatus(msg) {

    let result = await r6api.getStatus();
    let embed = new MessageEmbed()
        .setTitle("Server Status for PC")
        .setDescription(`The servers are currently ${result.PC.Status}`);
    msg.channel.send(embed);

}

async function retrieveOperator(name, operator) {

    try {
        await loadUser(name)
    } catch (err) {
        throw err
    }
    operators = stats.pvp.operators;
    if (!operators[operator]) {
        throw "that operator doesn't exist";
    }
    return operators;

}

async function operatorStatsEmbed(result, username, operator, msg) {
    let operatorName = await UpperCaseFirstLetter(result[operator].name)
    let user = await UpperCaseFirstLetter(username)
    async function calcRatio(x, y) {

        let result;

        if (x === 0 && y === 0) result = 1.00
        else if (y === 0) result = (Math.round((x / 1) * 100)) / 100
        else result = (Math.round((x / y) * 100)) / 100

        return result

    }

    let kdRatio = await calcRatio(result[operator].kills, result[operator].deaths)

    let winPercentage = ((result[operator].wins / (result[operator].wins + result[operator].losses)) * 100).toPrecision(4)

    let embed = new MessageEmbed()
        .setTitle(`${operatorName} stats for ${user}`)
        .setThumbnail(result[operator].badge)
        .addField("Kills", result[operator].kills, true)
        .addField("Deaths", result[operator].deaths, true)
        .addField("K/D Ratio", kdRatio, true)
        .addField("Wins", result[operator].wins, true)
        .addField("Losses", result[operator].losses, true)
        .addField("Win %", winPercentage + "%", true)

    for (gadget of result[operator].gadget) {
        embed.addField(gadget.name, gadget.value, true)
    }


    msg.channel.send(embed);
}

async function getOperators() {
    try {
        if (!stats) await loadUser("Mornis")
    } catch (err) {
        throw err;
    }
    operators = stats.pvp.operators
    let keys = []
    for (let key in operators) {
        keys.push(key)
    }
    return keys;
}

async function getWeapons(weaponType) {
    try {
        if (!stats) await loadUser("Mornis")
    } catch (err) {
        throw err;
    }
    weapons = stats.pvp.weapons
    let str = "";
    for (let weapon of weapons[weaponType].list) {
        str += "`" + weapon.name + "` \n ";
    }
    return str;
}


async function compareStatsEmbed(statsA, statsB, nameA, nameB, msg){
    let userA = await UpperCaseFirstLetter(nameA)
    let userB = await UpperCaseFirstLetter(nameB)
    async function calcRatio(x, y) {

        let result;

        if (x === 0 && y === 0) result = 1.00
        else if (y === 0) result = (Math.round((x / 1) * 100)) / 100
        else result = (Math.round((x / y) * 100)) / 100

        return result

    }

    let kdRatioA = await calcRatio(statsA.kills, statsA.deaths)
    let kdRatioB = await calcRatio(statsB.kills, statsB.deaths)

    let winPercentageA = await calcRatio(statsA.wins, statsA.matches)
    let winPercentageB = await calcRatio(statsB.wins, statsB.matches)

    let embed = new MessageEmbed()
        .setTitle(`Comparing stats of ${userA} and ${userB}`)
        .setDescription("\
        **Kills**\n\
        `" + userA + "`:" + statsA.kills + "  `" + userB + "`:" + statsB.kills + "\n\
        **Deaths**\n\
        `" + userA + "`:" + statsA.deaths + "  `" + userB + "`:" + statsB.deaths + "\n\
        **K/D Ratio**\n\
        `" + userA + "`:" + kdRatioA + "  `" + userB + "`:" + kdRatioB + "\n\
        **Wins**\n\
        `" + userA + "`:" + statsA.wins + "  `" + userB + "`:" + statsB.wins + "\n\
        **Losses**\n\
        `" + userA + "`:" + statsA.losses + "  `" + userB + "`:" + statsB.losses + "\n\
        **Win %**\n\
        `" + userA + "`:" + winPercentageA * 100 + "%  `" + userB + "`:" + winPercentageB * 100 + "%\n")

    msg.channel.send(embed);

}