export function extractDisplayFields(data) {
    switch (data.type) {
        case "album": {
            return {
                "Type": data.type,
                "Title": data.name,
                "Artists": data.artists.map(a => a.name),
                "Label": data.label,
                "Track count": data.total_tracks,
                "Release date": data.release_date,
                "ID (Spotify URI)": data.uri,
            };
        }
        case "playlist": {
            return {
                "Type": data.collaborative ? `${data.type} (collaborative)` : data.type,
                "Title": data.name,
                "Description": data.description,
                "Owner": data.owner.display_name,
                "Public": data.public ? "Yes" : "No",
                "Followers": data.followers.total,
                "Track count": data.tracks.total,
                "ID (Spotify URI)": data.uri,
            };
        }
    }
}
