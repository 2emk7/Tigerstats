const mineflayer = require('mineflayer');
const Hypixel = require('hypixel-api-reborn');
const readline = require('readline');
const HYPIXEL_API_KEY = 'ENTER API KEY';
const hypixel = new Hypixel.Client(HYPIXEL_API_KEY);
prefix = ['/gc', '/r']

// -------------------- Bot Setup --------------------
const bot = mineflayer.createBot({
    host: 'mc.hypixel.net',
    username: 'ENTER EMAIL',
    auth: 'microsoft',
    version: '1.8.9'
});

//--------------------- recognize messages --------------------
bot.on('message', async (message) => {

    const text = message.toString().trim();
    console.log(`[CHAT] ${text}`);

    if (text.includes(bot.username)) return;

    const isGuild = text.includes('Guild >');
    const currentPrefix = isGuild ? prefix[0] : prefix[1];

    if (text.includes('?help')) {
        bothelp(currentPrefix);
    } else if (text.includes('?calc')) {
        calc(text, currentPrefix);
    } else if (text.includes('?bw')) {
        handleBwCommand(text, currentPrefix);
    }
});

//--------------------- bot help --------------------
function bothelp(prefix) {
    bot.chat(`${prefix} Join for help or to see commands: https://discord.gg/sBdV4uwJVp`)
}
//--------------------- user input from terminal --------------------
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (input) => {
    if (!bot || !bot.player) return;

    bot.chat(input);
});
//--------------------- calc function --------------------
async function calc(text, prefix) { //?calc <username> <stat> < target>
    const afterCalctext = text.split('?calc ')[1];

    if (!afterCalctext) {
        bot.chat(`${prefix} Error: ?calc <username> <statRatio> <target#>`);
        return;
    }

    const parts = afterCalctext.split(' ');
    const username = parts[0];
    const statparam = parts[1];
    const target = parts[2];
    console.log(parts);


    try {
        const player = await hypixel.getPlayer(username);
        switch (statparam) {
            case 'fkdr':
                result = (target * player.stats.bedwars.finalDeaths) - player.stats.bedwars.finalKills;
                break;
            case 'wlr':
                result = (target * player.stats.bedwars.losses) - player.stats.bedwars.wins;
                break;
            case 'bblr':
            case 'blr':
                result = (target * player.stats.bedwars.beds.lost) - player.stats.bedwars.beds.broken;
                break;
            default:
                bot.chat(`${prefix} Invalid stat '${statparam}'. Use: fkdr, wlr, bblr`);
                return;
        }
        bot.chat(`${prefix} ${username}'s TARGET ${statparam.toUpperCase()}-> ${target} NEEDED: ${result}`)

    } catch (error) {
        bot.chat(`${prefix} Error: ?calc <username> <statRatio> <target#>`);
        console.error('Error:', error.message);
    }
}

//--------------------- get stats and output --------------------
async function get_statValue(player, statValue) {
    switch (statValue) {
        case 'fkdr':
            return 'finalKDRatio';
        case 'wlr':
            return 'WLRatio';
        case 'finals':
            return 'finalKills';
        case 'finaldeaths':
            return 'finalDeaths';
        case 'wins':
            return 'wins';
        case 'losses':
            return 'losses';
        case 'level':
            return 'level';
        default:
            throw new Error("INVALID_STAT");
    }

}

async function get_GamemodeClass(player, gamemode) {
    const bedwars = player.stats.bedwars;

    switch (gamemode) {
        case 'overall':
            return bedwars;
        case 'solo':
        case 'solos':
            return bedwars.solo;
        case 'doubles':
        case 'duos':
        case '2s':
            return bedwars.doubles;
        case 'threes':
        case 'trios':
        case '3s':
            return bedwars.threes;
        case 'fours':
        case '4s':
            return bedwars.fours;
        default:
            throw new Error("INVALID_GAMEMODE");
    }
}

//--------------------- get stats and output --------------------

async function handleBwCommand(text, prefix) {
    try {
        const afterBWtext = text.split('?bw ')[1];
        const parts = afterBWtext.split(' ');
        const username = parts[0];
        let player;

        try {
            player = await hypixel.getPlayer(username);
        } catch (error) {
            bot.chat(`${prefix} Error: Player '${username}' not found.`);
            return;
        }

        if (parts.length === 1) {
            try {
                console.log(player.stats.bedwars)

                fkdr = player.stats.bedwars.finalKDRatio;
                wlr = player.stats.bedwars.WLRatio;
                bblr = player.stats.bedwars.beds.BLRatio;
                finalkills = player.stats.bedwars.finalKills;
                wins = player.stats.bedwars.wins;
                level = player.stats.bedwars.level;

                bot.chat(`${prefix} [${level}✫] ${username}'s FKDR-${fkdr}, BBLR-${bblr}, WLR-${wlr}, FINALS-${finalkills}, WINS-${wins}`);

            } catch (error) {
                bot.chat(`${prefix} Error: ?bw <username>`);
                console.error('Error:', error.message);
            }
        }

        if (parts.length === 2) { // ?bw tynis fkdr
            try {
                let gamemode = 'overall';
                let statValue = parts[1].toLowerCase();

                gamemode = await get_GamemodeClass(player, gamemode)


                let bot_stat_output;
                if (statValue === 'bblr' || statValue === 'blr') {
                    bot_stat_output = gamemode.beds?.BLRatio;
                } else if (statValue === 'beds') {
                    bot_stat_output = gamemode.beds?.broken;
                } else if (statValue === 'bedslost') {
                    bot_stat_output = gamemode.beds?.lost;
                } else {
                    statValue = await get_statValue(player, statValue)
                    bot_stat_output = gamemode[statValue];
                }

                console.log(bot_stat_output)

                bot.chat(`${prefix} ${username}'s ${parts[1].toUpperCase()}: ${bot_stat_output}`);
            } catch (error) {
                if (error.message === "INVALID_STAT") {
                    bot.chat(`${prefix} Invalid stat '${parts[1]}'.`);
                } else {
                    bot.chat(`${prefix} Error: ?bw <username> <stat>`);
                }
                console.error('Error:', error.message);
            }
        }


        if (parts.length === 3) { // ?bw tynis fkdr duos
            try {
                let gamemode = parts[2].toLowerCase();
                let statValue = parts[1].toLowerCase();

                gamemode = await get_GamemodeClass(player, gamemode)


                let bot_stat_output;
                if (statValue === 'bblr' || statValue === 'blr') {
                    bot_stat_output = gamemode.beds?.BLRatio;
                } else if (statValue === 'beds') {
                    bot_stat_output = gamemode.beds?.broken;
                } else if (statValue === 'bedslost') {
                    bot_stat_output = gamemode.beds?.lost;
                } else {
                    statValue = await get_statValue(player, statValue)
                    bot_stat_output = gamemode[statValue];
                }

                console.log(bot_stat_output)

                bot.chat(`${prefix} ${username}'s ${parts[2]} ${parts[1].toUpperCase()}: ${bot_stat_output}`);
            } catch (error) {
                if (error.message === "INVALID_STAT") {
                    bot.chat(`${prefix} Invalid stat '${parts[1]}'.`);
                } else if (error.message === "INVALID_GAMEMODE") {
                    bot.chat(`${prefix} Invalid gamemode '${parts[2]}'.`);
                } else {
                    bot.chat(`${prefix} Error: ?bw <username> <stat> <mode>`);
                }
                console.error('Error:', error.message);
            }
        }

        if (parts.length > 3) {
            throw new Error(bot.chat(`${prefix} Error: Specify a command`));
        }
    } catch (error) {
        bot.chat(`${prefix} Error: Non-existant player`);
        console.error('Error:', error.message);
    }
}

bot.on('spawn', () => {
    console.log('Bot spawned');
});

bot.on('error', console.log);