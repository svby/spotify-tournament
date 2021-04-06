/* eslint-disable @typescript-eslint/no-explicit-any */

import { TrackSource } from "@/common/spotify";
import { fetchPaginated } from "@/common/util";
import { Store } from "vuex";

export class SavedSongs implements TrackSource {
  data: any;

  private displayName: string;
  private avatar: string;
  private uri: string;

  static get promptText(): string {
    return "N/A";
  }

  static async fetch(store: Store<any>): Promise<SavedSongs> {
    const token = store.state.token;
    const user = store.state.user;

    const data = await fetch(`https://api.spotify.com/v1/me/tracks`, {
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

    await fetchPaginated(data, data.next, token);

    return new SavedSongs(data, user);
  }

  private constructor(data: any, user: any) {
    this.data = data;
    this.displayName = user.display_name;
    this.avatar = user.images[0]?.url ?? "";
    this.uri = user.uri;
  }

  get displayFields(): Map<string, unknown> {
    return new Map([
      ["Type", "library"],
      ["Owner", this.displayName],
      ["Track count", this.data.total],
      ["ID (Spotify URI)", this.uri],
    ]);
  }

  get displayTitle(): string {
    return `${this.displayName}'s liked songs`;
  }

  get trackCount(): number {
    return this.data.total;
  }

  get tracks(): Array<any> {
    return this.data.items.map((i: any) => i.track);
  }

  get image(): string {
    return this.avatar;
  }

  getTrackImage(track: any): string {
    return track.album.images[0].url;
  }
}
