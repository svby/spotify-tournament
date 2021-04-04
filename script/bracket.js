const bye = {bye: null};

// Taken from https://stackoverflow.com/a/12646864/7366707. Thanks :)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export class Bracket {
    constructor(songs) {
        const songsShuffled = [...songs];
        shuffleArray(songsShuffled);
        this.songsShuffled = songsShuffled;

        const levels = 32 - Math.clz32(songs.length);

        this.currentRound = -1;
        this.generatedMatchups = [];
        this.maxRounds = levels;

        this.generateMatchup = (participants, round) => {
            let byes = 0;
            if (round === 0) {
                byes = (1 << this.maxRounds) - participants.length;
            }

            const shuffled = [...participants];
            shuffleArray(shuffled);

            const result = [];
            for (let i = 0; i < participants.length - byes; i += 2) {
                const left = participants[i];
                const right = participants[i + 1];

                result.push({left, right});
            }

            for (let i = participants.length - byes; i < participants.length; ++i) {
                result.push({left: participants[i], right: bye});
            }

            return result;
        }

        console.log(`${songs.length} songs`);
    }

    nextRound(winners) {
        let result;
        if (this.currentRound === -1) {
            result = this.generateMatchup(this.songsShuffled, 0);
        } else {
            const lastMatchup = this.generatedMatchups[this.generatedMatchups.length - 1];
            const winnerSongs = winners.map((w, i) => {
                const leftBye = lastMatchup[i].left.hasOwnProperty("bye");
                const rightBye = lastMatchup[i].right.hasOwnProperty("bye");

                // If one participant is a bye placeholder, the other one automatically wins
                if (leftBye !== rightBye) return leftBye ? lastMatchup[i].right : lastMatchup[i].left;
                else if (leftBye) return bye;
                else return w ? lastMatchup[i].left : lastMatchup[i].right;
            });

            if (winnerSongs.length === 1) {
                return {
                    winner: winnerSongs[0],
                    matchups: [],
                }
            }

            result = this.generateMatchup(winnerSongs, this.currentRound + 1);
        }

        this.generatedMatchups.push(result);
        this.currentRound++;
        return {
            winner: null,
            matchups: result,
        };
    }
}
