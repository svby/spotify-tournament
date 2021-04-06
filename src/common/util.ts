// TODO: code review
export async function fetchPaginated(toMerge: any, next: string, token: any): Promise<any> {
  if (!next) return toMerge;
  const response = await fetch(next, {
    method: "GET",
    headers: new Headers({
      Authorization: `${token.tokenType} ${token.accessToken}`,
    }),
  });
  const json = await response.json();
  toMerge.items = toMerge.items.concat(json.items);
  if (json.next) return await fetchPaginated(toMerge, json.next, token);
  else return toMerge;
}

export function getTime(): number {
  return Math.floor(new Date().getTime() / 1000);
}
