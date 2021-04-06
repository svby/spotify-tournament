import { Album } from "@/common/sources/album";
import { Playlist } from "@/common/sources/playlist";

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
    default:
      throw new Error(`Unknown object type ${objectType}`);
  }
}

const OBJECT_TYPE_EXPRESSIONS = Object.freeze({
  album: /spotify.com\/album\/([A-Za-z0-9]+)\??/,
  playlist: /spotify.com\/playlist\/([A-Za-z0-9]+)\??/,
  id: /([A-Za-z0-9]+)/,
});

export async function loadSource(objectType: string, objectId: string, token: any): Promise<TrackSource> {
  // TODO: simplify
  switch (objectType) {
    case "album": {
      const match = objectId.match(OBJECT_TYPE_EXPRESSIONS["album"]);
      const id = match ? match[1] : objectId;

      return await Album.fetch(id, token);
    }
    case "playlist": {
      const match = objectId.match(OBJECT_TYPE_EXPRESSIONS["playlist"]);
      const id = match ? match[1] : objectId;

      return await Playlist.fetch(id, token);
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

export function play(songUri: string, token: any): void {
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
