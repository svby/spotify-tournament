import {Bracket} from "./bracket.js"

let token;
let tokenExpiry = 0;

function getTime() {
    return Math.floor(new Date().getTime() / 1000);
}

export function fetchNewToken() {
    const currentLocation = window.location.href.split("?")[0];

    const params = new URLSearchParams({
        client_id: "1189301921ea4fd9872c18ce32944382",
        response_type: "token",
        redirect_uri: currentLocation,
        // state,
        scope: "playlist-read-private user-modify-playback-state",
        show_dialog: false,
    });
    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`

    window.location.href = authUrl;
}

const loginButton = document.getElementById("login-button");
loginButton.addEventListener("click", () => fetchNewToken());

// Fetch login token if this is a callback
const pageAnchor = window.location.hash.slice(1);
if (pageAnchor) {
    console.log("Access token received");
    const newToken = {};
    for (const [k, v] of pageAnchor.split("&").map(kv => kv.split("="))) {
        newToken[k] = v;
    }
    token = Object.freeze(newToken);
    tokenExpiry = getTime() + token.expires_in - 10; // Subtract a few seconds in case of inaccuracies

    // Store token
    localStorage.setItem("token", JSON.stringify(token));

    // Remove hash
    history.replaceState({}, document.title, ".");
} else {
    // Fetch from local storage if present
    const saved = localStorage.getItem("token");
    if (saved) {
        const savedToken = JSON.parse(saved);
        if (savedToken.expires_in < getTime()) {
            token = savedToken;
        }
    }
}

if (token) {
    // Hide login modal
    document.getElementById("modal-container").classList.remove("visible");
}

// Tournament listeners
let bracket;

const albumInput = document.getElementById("albumid");
if (albumInput.value) updateAlbum(albumInput.value);

function updateAlbum(albumId) {
    fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
        method: "GET",
        headers: new Headers({
            "Authorization": `${token.token_type} ${token.access_token}`
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert("That album ID does not exist");
            }
            const songs = data.tracks.items;
            bracket = new Bracket(songs);

            document.querySelector("#matchups").innerHTML = "";
            addRound(1, bracket.nextRound());
        });
}

albumInput.addEventListener("change", e => updateAlbum(e.target.value));

function addRound(i, round) {
    const matchupContainer = document.querySelector("#matchups");

    const roundContainer = document.createElement("div");
    roundContainer.classList.add("round");
    matchupContainer.appendChild(roundContainer);

    if (round.winner) {
        const head = document.createElement("h2");
        head.innerHTML = "Winner";
        roundContainer.appendChild(head);

        const p = document.createElement("p");
        p.innerHTML = round.winner.name;
        roundContainer.appendChild(p);

        console.log("Winner:");
        console.log(round.winner);
        play(round.winner);
    } else {
        const {matchups} = round;
        let winners = Array(matchups.length).fill(null);

        const head = document.createElement("p");
        head.innerHTML = `Matchups, round ${i}:`;
        roundContainer.appendChild(head);

        const ol = document.createElement("ol");
        roundContainer.appendChild(ol);

        for (let i = 0; i < matchups.length; ++i) {
            const matchupIndex = i;
            const matchup = matchups[matchupIndex];

            const li = document.createElement("li");

            const part1 = document.createElement("div");
            const leftBye = matchup.left.hasOwnProperty("bye");
            const rightBye = matchup.right.hasOwnProperty("bye");

            const leftString = leftBye ? "[BYE]" : matchup.left.name;
            const rightString = rightBye ? "[BYE]" : matchup.right.name;

            const leftSpan = document.createElement("span");
            leftSpan.innerText = leftString;

            const rightSpan = document.createElement("span");
            rightSpan.innerText = rightString;

            part1.appendChild(leftSpan);
            part1.appendChild(document.createTextNode(" vs "));
            part1.appendChild(rightSpan);

            const part2 = document.createElement("div");
            for (const track of [matchup.left, matchup.right]) {
                (() => {
                    const playLink = document.createElement("a");
                    playLink.innerText = `Play ${track.name} on Spotify`
                    playLink.style.display = "block";
                    playLink.addEventListener("click", () => play(track));

                    part2.appendChild(playLink);
                })(track);
            }

            li.appendChild(part1);
            li.appendChild(part2);

            if (!leftBye && !rightBye) {
                leftSpan.addEventListener("click", () => {
                    winners[matchupIndex] = true;
                    leftSpan.style.color = "green";
                    rightSpan.style.color = "red";
                });

                rightSpan.addEventListener("click", () => {
                    winners[matchupIndex] = false;
                    leftSpan.style.color = "red";
                    rightSpan.style.color = "green";
                });

                leftSpan.style.color = rightSpan.style.color = "blue";
            } else {
                leftSpan.style.color = rightSpan.style.color = "gray";
            }

            ol.appendChild(li);
        }

        const next = document.createElement("button");
        next.innerHTML = "Next round";

        matchupContainer.appendChild(next);

        next.addEventListener("click", () => {
            for (let i = 0; i < matchups.length; ++i) {
                const matchup = matchups[i];

                if (matchup.left.hasOwnProperty("bye") || matchup.right.hasOwnProperty("bye")) continue;

                if (winners[i] === null) {
                    alert("You haven't selected winners for all matchups yet");
                    return;
                }
            }
            matchupContainer.removeChild(next);
            addRound(i + 1, bracket.nextRound(winners));
        });
    }
}

export function play(song) {
    fetch(`https://api.spotify.com/v1/me/player/play`, {
        method: "PUT",
        headers: new Headers({
            "Authorization": `${token.token_type} ${token.access_token}`,
            "Content-Type": "application/json"
        }),
        body: JSON.stringify({
            "uris": [song.uri]
        })
    }).catch(e => {
        alert(`Couldn't play song: ${e}`);
    });
}
