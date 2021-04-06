/* eslint-disable @typescript-eslint/no-explicit-any */

import { Store } from "vuex";
import { TrackSource } from "@/common/spotify";
import { fetchPaginated } from "@/common/util";

export class Playlist implements TrackSource {
  data: any;

  static get promptText(): string {
    return "Enter a playlist URL or ID here";
  }

  static async fetch(store: Store<any>, id: string): Promise<Playlist> {
    const token = store.state.token;

    const data = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
      method: "GET",
      headers: new Headers({
        Authorization: `${token.tokenType} ${token.accessToken}`,
      }),
    })
      .then((data) => data.json())
      .then((data) => {
        if (data.error) throw new Error(`Error loading playlist: ${data.error.message}`);
        return data;
      });

    await fetchPaginated(data.tracks, data.tracks.next, token);

    return new Playlist(data);
  }

  private constructor(data: any) {
    this.data = data;
  }

  get displayFields(): Map<string, unknown> {
    return new Map([
      ["Type", this.data.collaborative ? `${this.data.type} (collaborative)` : this.data.type],
      ["Title", this.data.name],
      ["Description", this.data.description],
      ["Owner", this.data.owner.display_name],
      ["Public", this.data.public ? "Yes" : "No"],
      ["Followers", this.data.followers.total],
      ["Track count", this.data.tracks.total],
      ["ID (Spotify URI)", this.data.uri],
    ]);
  }

  get displayTitle(): string {
    return `${this.data.name} by ${this.data.owner.display_name}`;
  }

  get trackCount(): number {
    return this.data.total_tracks;
  }

  get tracks(): Array<any> {
    return this.data.tracks.items.map((i: any) => i.track);
  }

  get image(): string {
    return this.data.images[0].url;
  }

  getTrackImage(track: any): string {
    return track.album.images[0].url;
  }
}
