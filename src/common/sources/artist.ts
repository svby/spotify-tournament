/* eslint-disable @typescript-eslint/no-explicit-any */

import { Store } from "vuex";
import { TrackSource } from "@/common/spotify";
import { fetchPaginated } from "@/common/util";
import { Album } from "@/common/sources/album";

export class Artist implements TrackSource {
  data: any;
  albumSources: Array<Album> = [];

  static get promptText(): string {
    return "Enter an artist URL or ID here";
  }

  static async fetch(store: Store<any>, id: string): Promise<Artist> {
    const token = store.state.token;

    const artist = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
      method: "GET",
      headers: new Headers({
        Authorization: `${token.tokenType} ${token.accessToken}`,
      }),
    })
      .then((data) => data.json())
      .then((data) => {
        if (data.error) throw new Error(`Error loading artist: ${data.error.message}`);
        return data;
      });

    const albums = await fetch(`https://api.spotify.com/v1/artists/${id}/albums`, {
      method: "GET",
      headers: new Headers({
        Authorization: `${token.tokenType} ${token.accessToken}`,
      }),
    })
      .then((data) => data.json())
      .then((data) => {
        if (data.error) throw new Error(`Error loading artist albums: ${data.error.message}`);
        return data;
      });

    await fetchPaginated(albums, albums.next, token);

    const albumSources = [];
    for (const album of albums.items) {
      albumSources.push(await Album.fetch(store, album.id));
    }

    return new Artist(artist, albumSources);
  }

  private constructor(data: any, albumSources: Array<Album>) {
    this.data = data;
    this.albumSources = albumSources;
  }

  get displayFields(): Map<string, unknown> {
    return new Map([
      ["Type", "artist"],
      ["Name", this.data.name],
      ["Albums", this.albumSources.length],
      ["Genres", this.data.genres.join(", ")],
      ["Track count", this.albumSources.map((a) => a.trackCount).reduce((a, c) => a + c, 0)],
      ["ID (Spotify URI)", this.data.uri],
    ]);
  }

  get displayTitle(): string {
    return `${this.data.name}`;
  }

  get trackCount(): number {
    return this.data.total_tracks;
  }

  get tracks(): Array<any> {
    return this.albumSources.flatMap((a: any) => a.tracks);
  }

  get image(): string {
    return this.data.images[0].url;
  }

  getTrackImage(): string {
    return this.image;
  }
}
