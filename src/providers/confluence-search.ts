import { ExtensionContext } from "vscode";
import { ConfluenceSingleton } from "../common/confluence-singleton";
import { Cache } from "../common/persistent-cache";

export class ConfluenceSearchProvider {
  private _cache: Cache;

  constructor(private readonly _context: ExtensionContext, cacheSize: number) {
    this._cache = new Cache("search-cache", this._context, cacheSize);
  }

  public getCachedSearchResults = async (cql: string) => {
    let cachedResponse: any = await this._cache.get(cql);
    if (cachedResponse === undefined) {
      let response = await this.getSearchResults(cql);
      this._cache.set(cql, JSON.stringify(response));
      return response;
    }
    return JSON.parse(cachedResponse);
  };

  public getSearchResults = async (cql: string) => {
    const response: any = await (
      await ConfluenceSingleton.getConfluenceObject(this._context)
    ).search(cql);
    return { response };
  };

  public clearCache = async () => {
    this._cache.clearCache();
  };
}
