import { Store } from "vuex";
import { Album } from "@/common/sources/album";
import { Playlist } from "@/common/sources/playlist";
import { Artist } from "@/common/sources/artist";
import { SavedSongs } from "@/common/sources/saved";

export interface TrackSource {
  displayFields: Map<string, unknown>;
  displayTitle: string;
  trackCount: number;
  tracks: Array<any>;

  image: string;

  data: any;

  getTrackImage(track: any): string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringToSourceType(objectType: string): any {
  switch (objectType) {
    case "album":
      return Album;
    case "playlist":
      return Playlist;
    case "artist":
      return Artist;
    case "saved":
      return SavedSongs;
    default:
      throw new Error(`Unknown object type ${objectType}`);
  }
}

const OBJECT_TYPE_EXPRESSIONS = Object.freeze({
  album: /spotify.com\/album\/([A-Za-z0-9]+)\??/,
  playlist: /spotify.com\/playlist\/([A-Za-z0-9]+)\??/,
  artist: /spotify.com\/artist\/([A-Za-z0-9]+)\??/,
  id: /([A-Za-z0-9]+)/,
});

export async function loadSource(store: Store<any>, objectType: string, objectId: string): Promise<TrackSource> {
  // TODO: simplify
  switch (objectType) {
    case "album": {
      const match = objectId.match(OBJECT_TYPE_EXPRESSIONS["album"]);
      const id = match ? match[1] : objectId;

      return await Album.fetch(store, id);
    }
    case "playlist": {
      const match = objectId.match(OBJECT_TYPE_EXPRESSIONS["playlist"]);
      const id = match ? match[1] : objectId;

      return await Playlist.fetch(store, id);
    }
    case "artist": {
      const match = objectId.match(OBJECT_TYPE_EXPRESSIONS["artist"]);
      const id = match ? match[1] : objectId;

      return await Artist.fetch(store, id);
    }
    case "saved": {
      return await SavedSongs.fetch(store);
    }
    default:
      throw new Error(`Unknown object type ${objectType}`);
  }
}

export function inferSourceData(input: string): { success: boolean; data?: { objectType: string; objectId: string } } {
  for (const [objectType, regex] of Object.entries(OBJECT_TYPE_EXPRESSIONS)) {
    const match = input.match(regex);
    if (match) {
      return {
        success: true,
        data: { objectType, objectId: match[1] },
      };
    }
  }

  return { success: false };
}

export function play(token: any, songUri: string): void {
  fetch(`https://api.spotify.com/v1/me/player/play`, {
    method: "PUT",
    headers: new Headers({
      Authorization: `${token.tokenType} ${token.accessToken}`,
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      uris: [songUri],
    }),
  }).catch((e) => {
    alert(`Couldn't play song: ${e}`);
  });
}
