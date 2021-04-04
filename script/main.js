import {Bracket} from "./bracket.js";

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

function tryLoadToken() {
    document.getElementById("modal-container").classList.add("visible");

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
        const username = document.querySelector("#username");
        fetch(`https://api.spotify.com/v1/me`, {
            method: "GET",
            headers: new Headers({
                "Authorization": `${token.token_type} ${token.access_token}`
            })
        })
            .then(data => data.json())
            .then(data => {
                if (data.error) {
                    alert(`Error: ${data.error.message}`);
                    if (data.error.message.includes("token expire")) {
                        localStorage.removeItem("token");
                        token = null;
                        tryLoadToken();
                    } else {
                        alert(`Couldn't fetch user information: ${e}`);
                    }
                    return;
                }
                username.innerText = data.display_name;
            });

        // Hide login modal
        document.getElementById("modal-container").classList.remove("visible");
    }
}

tryLoadToken();

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

const steps = [
    document.querySelector("#step1"),
    document.querySelector("#step2"),
    document.querySelector("#step3"),
];

const nav = document.querySelector("#breadcrumb ol");

let selectedAlbum;
let currentStep;

let nextCallback;
let selectCallback;
let roundCallback;
let playCallback;
let matchupCallback;

let winner;

function toggleStep(step) {
    currentStep = step;

    steps.forEach(s => s.classList.add("hidden"));
    steps[step].classList.remove("hidden");

    // TODO for later: back/forward navigation
    for (const li of nav.querySelectorAll("li")) {
        li.classList.remove("selected");
    }
    const current = nav.querySelector(`li:nth-child(${step + 1})`);
    current.classList.add("selected");

    switch (step) {
        case 0: {
            // Step 1
            const albumidInput = document.querySelector("#albumid");
            const fetchButton = document.querySelector("#fetch");
            const updateAlbumid = (idInput) => {
                const match = idInput.match(/spotify.com\/album\/(.+?)\?/);
                const id = match ? match[1] : idInput;

                fetchButton.disabled = true;
                fetch(`https://api.spotify.com/v1/albums/${id}`, {
                    method: "GET",
                    headers: new Headers({
                        "Authorization": `${token.token_type} ${token.access_token}`
                    })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            alert(`Error: ${data.error.message}`);
                            return;
                        }

                        const
                            albumInfoContainer = document.querySelector("#album-info-container"),
                            albumTitleData = document.querySelector("#album-title-data"),
                            albumTypeData = document.querySelector("#album-type-data"),
                            albumArtistsData = document.querySelector("#album-artists-data"),
                            albumLabelData = document.querySelector("#album-label-data"),
                            albumTracksData = document.querySelector("#album-tracks-data"),
                            albumDateData = document.querySelector("#album-date-data"),
                            albumUriData = document.querySelector("#album-uri-data"),
                            albumImage = document.querySelector("#album-image");

                        albumTitleData.innerText = data.name;
                        albumTypeData.innerText = data.type;
                        // TODO link to artist pages?
                        albumArtistsData.innerText = data.artists.map(a => a.name).join(", ");
                        albumLabelData.innerText = data.label;
                        albumTracksData.innerText = `${data.total_tracks}`;
                        albumDateData.innerText = data.release_date;
                        albumUriData.innerText = data.uri;

                        {
                            albumImage.innerHTML = "";
                            const img = document.createElement("img");
                            img.src = data.images[0].url;
                            albumImage.appendChild(img);
                        }

                        albumInfoContainer.classList.remove("hidden");

                        selectedAlbum = data;
                    })
                    .catch(e => {
                        alert(`Couldn't fetch album: ${e}`);
                    })
                    .finally(() => fetchButton.disabled = false);
            };

            nextCallback = () => {
                if (!selectedAlbum) {
                    alert("No album selected");
                    return;
                } else if (selectedAlbum.total_tracks < 2) {
                    alert("You can't rank singles! (at least 2 tracks required)");
                    return;
                }

                toggleStep(1);
            };

            fetchButton.addEventListener("click", () => updateAlbumid(albumidInput.value));

            break;
        }
        case 1: {
            // Step 2
            const albumTitle = document.querySelector("#step2-album-title");
            albumTitle.innerText = `${selectedAlbum.name} by ${selectedAlbum.artists.map(a => a.name).join(", ")}`;

            const bracket = new Bracket(selectedAlbum.tracks.items);

            let round = bracket.nextRound([]);
            let winners = Array(round.matchups.length).fill(null);
            let currentRound = 0;
            let currentMatchup = 0;

            let matchupStatusItems;

            const updateMatchupDisplay = () => {
                const matchup = round.matchups[currentMatchup];
                const
                    titleLeft = document.querySelector("#step2-item-left-title"),
                    titleRight = document.querySelector("#step2-item-right-title"),
                    matchupCount = document.querySelector("#step2-current-matchup"),
                    totalMatchups = document.querySelector("#step2-total-matchups"),
                    roundCount = document.querySelector("#step2-current-round"),
                    totalRounds = document.querySelector("#step2-total-rounds");

                matchupCount.innerText = `${currentMatchup + 1}`;
                totalMatchups.innerText = `${round.matchups.length}`;
                roundCount.innerText = `${currentRound + 1}`;
                totalRounds.innerText = `${bracket.totalRounds}`;

                titleLeft.innerText = matchup.left.name;
                titleRight.innerText = matchup.right.name;

                for (let i = 0; i < round.matchups.length; ++i) {
                    const matchup = round.matchups[i];

                    // Ignore bye matches
                    if (matchup.left.hasOwnProperty("bye") || matchup.right.hasOwnProperty("bye")) continue;

                    matchupStatusItems[i].innerText =
                        (winners[i] === null
                            ? "(undecided)"
                            : (winners[i]
                                ? round.matchups[i].left.name
                                : round.matchups[i].right.name));
                }
            }

            const reconstruct = () => {
                const matchupStatus = document.querySelector("#step2-matchup-status");
                const statusOl = matchupStatus.querySelector("ol");

                statusOl.innerHTML = "";

                matchupStatusItems = Array(round.matchups.length).fill(null)
                    .map(() => document.createElement("li"));

                matchupStatusItems.forEach((e, index) => {
                    const i = index;

                    const matchup = round.matchups[i];

                    // Ignore bye matches
                    if (matchup.left.hasOwnProperty("bye") || matchup.right.hasOwnProperty("bye")) {
                        e.classList.add("bye");
                        e.innerText = "(bye matchup)";
                    } else {
                        if (round.matchups[i])
                            e.addEventListener("click", () => {
                                currentMatchup = i;
                                updateMatchupDisplay();
                            });
                    }

                    statusOl.appendChild(e);
                });
            };

            selectCallback = (left) => {
                winners[currentMatchup] = left;
                updateMatchupDisplay();
            };

            playCallback = (left) => {
                const matchup = round.matchups[currentMatchup];
                play(left ? matchup.left : matchup.right);
            };

            matchupCallback = () => {
                for (let i = 1; i < round.matchups.length; ++i) {
                    const newIndex = (currentMatchup + i) % (round.matchups.length);
                    const newMatchup = round.matchups[newIndex];
                    if (newMatchup.left.hasOwnProperty("bye") || newMatchup.right.hasOwnProperty("bye")) continue;
                    currentMatchup = newIndex;
                    break;
                }
                console.log(currentMatchup);
                updateMatchupDisplay();
            };

            roundCallback = () => {
                for (let i = 0; i < round.matchups.length; ++i) {
                    const matchup = round.matchups[i];

                    if (matchup.left.hasOwnProperty("bye") || matchup.right.hasOwnProperty("bye")) continue;

                    if (winners[i] === null) {
                        alert("You haven't selected winners for all matchups yet");
                        return;
                    }
                }

                round = bracket.nextRound(winners);

                if (round.winner) {
                    winner = round.winner;
                    toggleStep(2);
                    return;
                }

                winners = Array(round.matchups.length).fill(null);
                currentMatchup = 0;
                currentRound++;

                reconstruct();
                updateMatchupDisplay();
            };

            reconstruct();
            updateMatchupDisplay();

            break;
        }
        case 2: {
            const iframe = document.querySelector("#step3 iframe");

            const extUrl = winner.external_urls["spotify"];
            const search = "spotify.com/"
            const index = extUrl.indexOf(search) + search.length;
            console.log(`a: '${extUrl.substring(0, index)}', b: '${extUrl.substring(index)}'`)

            const split = winner.external_urls["spotify"].split("spotify.com/")
            iframe.src = `${extUrl.substring(0, index)}embed/${extUrl.substring(index)}`;

            break;
        }
    }
}

toggleStep(0);
document.querySelector("#loading-container").classList.add("hidden");

document.querySelector("#next").addEventListener("click", () => {
    if (nextCallback) nextCallback();
});

document.querySelector("#step2-selector-left").addEventListener("click", () => {
    if (selectCallback) selectCallback(true);
});

document.querySelector("#step2-selector-right").addEventListener("click", () => {
    if (selectCallback) selectCallback(false);
});

document.querySelector("#step2-item-left .play").addEventListener("click", () => {
    if (playCallback) playCallback(true);
});

document.querySelector("#step2-item-right .play").addEventListener("click", () => {
    if (playCallback) playCallback(false);
});

document.querySelector("#step2-next-round").addEventListener("click", () => {
    if (roundCallback) roundCallback();
});

document.querySelector("#step2-next-matchup").addEventListener("click", () => {
    if (matchupCallback) matchupCallback();
});
