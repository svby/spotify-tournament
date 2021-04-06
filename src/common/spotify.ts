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

export async function loadSource(objectType: string, objectId: string, token: any): Promise<TrackSource> {
  switch (objectType) {
    case "album": {
      const match = objectId.match(/spotify.com\/album\/([A-Za-z0-9]+)\??/);
      const id = match ? match[1] : objectId;

      return await Album.fetch(id, token);
    }
    case "playlist": {
      const match = objectId.match(/spotify.com\/playlist\/([A-Za-z0-9]+)\??/);
      const id = match ? match[1] : objectId;

      return await Playlist.fetch(id, token);
    }
    default:
      throw new Error(`Unknown object type ${objectType}`);
  }
}
