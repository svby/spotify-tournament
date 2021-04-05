const bye = {bye: null};

// Taken from https://stackoverflow.com/a/12646864/7366707. Thanks :)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export class Bracket {
    static createTestBracket() {
        let test = new Bracket(
            [
                {name: "STFU"},
                {name: "ROCKET SHIP Intro"},
                {name: "Tim's Past"},
                {name: "ROCKET SHIP"},
                {name: "Interlude 2"},
                {name: "KURT"},
                {name: "Timmis"},
                {name: "TOO FAMOUS"},
                {name: "The Call"},
                {name: "BACK UP (He's the Man)"},
            ]
        );
        test.nextRound();
        test.nextRound([
            true, false
        ]);
        test.nextRound([false, true, true, true]);
        test.nextRound([true, false]);
        test.nextRound([false]);

        return test;
    }

    constructor(songs) {
        const songsShuffled = [...songs];
        shuffleArray(songsShuffled);
        this.songsShuffled = songsShuffled;
        this.winner = null;

        // TODO replace this. This is really ugly
        let levels = 32 - Math.clz32(songs.length);
        // When the amount of songs is a power of 2, don't round up:
        if ((songs.length << 1) === (1 << levels)) --levels;

        const shuffledWithByes = [];

        // Add paired matches
        for (let i = 0; i < 2 * songsShuffled.length - (1 << levels); ++i) shuffledWithByes.push(songsShuffled[i]);

        // Add bye matches
        for (let i = 2 * songsShuffled.length - (1 << levels); i < songsShuffled.length; ++i) {
            shuffledWithByes.push(songsShuffled[i]);
            shuffledWithByes.push(bye);
        }

        this.songsShuffledWithByes = shuffledWithByes;

        this.currentRound = -1;
        this.roundResults = [];
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
            this.roundResults.push([]);
        } else {
            const lastMatchup = this.generatedMatchups[this.generatedMatchups.length - 1];
            console.log(lastMatchup);

            // Fill/trim empty space
            winners = winners.slice(0, Math.min(winners.length, lastMatchup.length));
            const toAdd = lastMatchup.length - winners.length;
            for (let i = 0; i < toAdd; ++i) winners.push(null);

            const winnerSongs = winners.map((w, i) => {
                const leftBye = lastMatchup[i].left.hasOwnProperty("bye");
                const rightBye = lastMatchup[i].right.hasOwnProperty("bye");

                // If one participant is a bye placeholder, the other one automatically wins
                if (leftBye !== rightBye) {
                    if (leftBye) {
                        winners[i] = false;
                        return lastMatchup[i].right;
                    } else {
                        winners[i] = true;
                        return lastMatchup[i].left;
                    }
                } else if (leftBye) return bye;
                else return w ? lastMatchup[i].left : lastMatchup[i].right;
            });

            if (winnerSongs.length === 1) {
                this.winner = winnerSongs[0];
                return {
                    winner: winnerSongs[0],
                    matchups: [],
                }
            }

            result = this.generateMatchup(winnerSongs, this.currentRound + 1);
            this.roundResults.push(winners);
        }

        this.generatedMatchups.push(result);
        this.currentRound++;
        return {
            winner: null,
            matchups: result,
        };
    }

    get totalRounds() {
        return this.maxRounds;
    }
}
