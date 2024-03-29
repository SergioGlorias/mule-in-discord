const { Chess } = require("chess.js")
const dayjs = require("dayjs")
const duration = require("dayjs/plugin/duration")
dayjs.extend(duration);

function getPlayerName(player) {
    let name = '';
    if (player.fname) name += player.fname;
    if (player.mname) name += ` ${player.mname}`;
    if (player.lname) name += ` ${player.lname}`;
    return name;
}

async function getLCC(source, gamesParam) {
    const tournamentId = source.tournamentId
    const round = source.round

    const roundInfo = await fetch(
        `https://1.pool.livechesscloud.com/get/${tournamentId}/round-${round}/index.json`
    ).then(res => res.status !== 200 ? null : res.json());

    if (!roundInfo) return ''

    const games = []

    for (let i = 1; i <= roundInfo.pairings.length; i++) {
        if (i > gamesParam) break
        let getGame = await fetch(
            `https://1.pool.livechesscloud.com/get/${tournamentId}/round-${round}/game-${i}.json`
        ).then(res => res.status !== 200 ? null : res.json());
        games.push(getGame);
    }

    let pgn = ''

    for (const [boardIndex, game] of games.entries()) {
        const pairing = roundInfo.pairings[boardIndex];
        const chess = new Chess();

        if (pairing.white) {
            chess.header(
                'White', getPlayerName(pairing.white)
            );
            if (pairing.white.title) {
                chess.header('WhiteTitle', pairing.white.title);
            }
            if (pairing.white.fideid) {
                chess.header('WhiteFideId', pairing.white.fideid.toString());
            }
        }
        if (pairing.black) {
            chess.header(
                'Black', getPlayerName(pairing.black)
            );
            if (pairing.black.title) {
                chess.header('BlackTitle', pairing.black.title);
            }
            if (pairing.black.fideid) {
                chess.header('BlackFideId', pairing.black.fideid.toString());
            }
        }

        chess.header(
            'Result', pairing.result
        );

        if (game) {
            let lastTime = ""
            for (const move of game.moves) {
                try {
                    const [sat, timeStringInSecs] = move.split(' ');
                    chess.move(sat);

                    if (timeStringInSecs !== undefined && !timeStringInSecs.startsWith('+')) {
                        const time = dayjs.duration(parseInt(timeStringInSecs), "seconds")
                        lastTime = `[%clk ${time.hours()}:${time.minutes()}:${time.seconds()}]`
                        chess.setComment(lastTime);
                    }
                } catch {
                    break
                }
            }
        }

        pgn += chess.pgn() + '\n\n';
    }

    return pgn
}

module.exports = {
    getLCC
}