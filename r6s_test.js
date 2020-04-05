require('dotenv').config()

const { Client, MessageEmbed } = require('discord.js');

const client = new Client();

client.login(process.env.BOT_TOKEN);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
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

client.on('message', msg => {
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
            retrieveWeapon(line[1], line[2].toUpperCase())
                .then((result) => {
                    let embed = new MessageEmbed();
                    embed.setTitle(result.name);
                    embed.setDescription(`Kills: ${result.kills}`);
                    msg.channel.send(embed);
                })
                .catch((err) => {
                    msg.channel.send(err);
                });
            break;
        case "STATS":
            if (line.length < 2) {
                msg.channel.send("not enough arguments");
                break;
            }
            retrieveStats(line[1])
                .then((result) => {
                    statsEmbed(result, line[1], msg);
                })
                .catch((err) => {
                    msg.channel.send(err);
                });
            break;
        case "TYPEKILL":
                if (line.length < 3) {
                    msg.channel.send("not enough arguments");
                    break;
                }
            retrieveTypeKills(line[1], line[2].toLowerCase())
            .then((result) => {
                let embed = new MessageEmbed()
                    .setTitle(`${line[1]}'s kills with ${line[2].toUpperCase()}`)
                    .addField("Total",result.toString());
                msg.channel.send(embed);
            })
            .catch((err) => {
                msg.channel.send(err);
            })
            break;
        case "HELP":
            help(msg)
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
        //console.log(weaponType);
        for (let i = 0; i < weapons[weaponType].list.length; i++) {
            if (weapons[weaponType].list[i].name.toUpperCase().replace(/\s/g, '') === weapon) {
                result = weapons[weaponType].list[i];
                console.log(result);
                break;
            }
        }
        //console.log(weapons[weaponType].list);
    }

    if (!result) {
        let error = "weapon not found";
        console.log(error);
        throw error;
    }

    return result;
}

function loadUser(name) {

    return new Promise((resolve, reject) => {
        r6api.getId(platform, name)
            .then(user => {
                if (!user[0]) {
                    reject("user not found");
                }
                id = user[0].userId
                r6api.getStats(platform, id)
                    .then(statistics => {
                        stats = statistics[0];
                        console.log('User Retrieved');
                        resolve('success');
                    });
            }
            ).catch((error) => {
                reject(error);
            })
    });
}


async function retrieveStats(name) {
    try {
        await loadUser(name)
    } catch (err) {
        throw err
    }

    return stats.pvp.general;
}

async function statsEmbed(result, name, msg) {

    let embed = new MessageEmbed();

    embed.setTitle(`General Stats for ${name}`);
    embed.addField("Kills", result.kills, true)
    embed.addField("Deaths", result.deaths, true)
    embed.addField("K/D Ratio", (result.kills / result.deaths).toPrecision(3), true);
    embed.addField("Wins", result.wins, true)
    embed.addField("Losses", result.losses, true)
    embed.addField("Win %", ((result.wins / result.matches) * 100).toPrecision(4) + "%", true)

    msg.channel.send(embed);

}


async function retrieveTypeKills(name, weaponType){
    try {
        await loadUser(name)
    } catch (err) {
        throw err
    }
    weapons = stats.pvp.weapons;


    if(!weapons[weaponType]){
        throw "that type doesn't exist";
    }
    let sum = 0;
    for(gun of weapons[weaponType].list){
        sum += gun.kills;   
    }
    console.log(sum);
    return sum;

}

async function help(msg){
    let embed = new MessageEmbed();
    embed.setTitle(`Help:`);
    embed.setDescription(`"weapon": Show amount of kills with specific weapon. eg. "çweapon Mornis mpx"
                          "stats" : Show stats like kills, deaths, etc. eg. "çstats Mornis"
                          "typekill": Show kills with a specific type of weapon. eg. "çtypekill Mornis assault"
                          Defined types are: assault, smg, lmg, marksman, pistol, shotgun and mp.
    `);
    msg.channel.send(embed);
}