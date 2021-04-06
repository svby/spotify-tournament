/* eslint-disable */
const bye = { bye: null };

// Taken from https://stackoverflow.com/a/12646864/7366707. Thanks :)
function shuffleArray<T>(array: Array<T>) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export default class Bracket {
  public currentRoundIndex: number = -1;
  public totalRounds: number;

  // TODO: typing
  public roundResults: Array<any>;
  public generatedMatchups: Array<Array<any>>;

  public participants: Array<any>;
  public participantsWithByes: Array<any>;
  public winner?: any = null;

  static createTestBracket() {
    let test = new Bracket([
      { name: "STFU" },
      { name: "ROCKET SHIP Intro" },
      { name: "Tim's Past" },
      { name: "ROCKET SHIP" },
      { name: "Interlude 2" },
      { name: "KURT" },
      { name: "Timmis" },
      { name: "TOO FAMOUS" },
      { name: "The Call" },
      { name: "BACK UP (He's the Man)" },
    ]);
    test.nextRound([]);
    test.nextRound([true, false]);
    test.nextRound([false, true, true, true]);
    test.nextRound([true, false]);
    test.nextRound([false]);

    return test;
  }

  constructor(songs: Array<any>) {
    const songsShuffled = [...songs];
    shuffleArray(songsShuffled);
    this.participants = songsShuffled;

    // TODO replace this. This is really ugly
    let levels = 32 - Math.clz32(songs.length);
    // When the amount of songs is a power of 2, don't round up:
    if (songs.length << 1 === 1 << levels) --levels;

    const shuffledWithByes = [];

    // Add paired matches
    for (let i = 0; i < 2 * songsShuffled.length - (1 << levels); ++i) shuffledWithByes.push(songsShuffled[i]);

    // Add bye matches
    for (let i = Math.max(0, 2 * songsShuffled.length - (1 << levels)); i < songsShuffled.length; ++i) {
      shuffledWithByes.push(songsShuffled[i]);
      shuffledWithByes.push(bye);
    }

    this.participantsWithByes = shuffledWithByes;

    this.roundResults = [];
    this.generatedMatchups = [];
    this.totalRounds = levels;

    this.nextRound([]);
  }

  private generateMatchup(participants: Array<any>, round: number): Array<any> {
    if (participants.length === 0) {
      return [];
    }

    let byes = 0;
    if (round === 0) {
      byes = (1 << this.totalRounds) - participants.length;
    }

    const shuffled = [...participants];
    shuffleArray(shuffled);

    const result = [];
    for (let i = 0; i < participants.length - byes; i += 2) {
      const left = participants[i];
      const right = participants[i + 1];

      result.push({ left, right });
    }

    for (let i = participants.length - byes; i < participants.length; ++i) {
      result.push({ left: participants[i], right: bye });
    }

    return result;
  }

  get currentRound(): Array<any> {
    return this.generatedMatchups[this.generatedMatchups.length - 1];
  }

  nextRound(winners: Array<boolean | null>) {
    let result;
    if (this.currentRoundIndex === -1) {
      result = this.generateMatchup(this.participants, 0);
      this.roundResults.push([]);
    } else {
      const lastMatchup = this.generatedMatchups[this.generatedMatchups.length - 1];

      // Fill/trim empty space
      winners = winners.slice(0, Math.min(winners.length, lastMatchup.length));
      const toAdd = lastMatchup.length - winners.length;
      for (let i = 0; i < toAdd; ++i) winners.push(true);

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
        };
      }

      result = this.generateMatchup(winnerSongs, this.currentRoundIndex + 1);
      this.roundResults.push(winners);
    }

    this.generatedMatchups.push(result);
    this.currentRoundIndex++;

    return {
      winner: null,
      matchups: result,
    };
  }
}
