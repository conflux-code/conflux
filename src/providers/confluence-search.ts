import { ExtensionContext } from "vscode";
import { ConfluenceSingleton } from "../common/confluence-singleton";
import { Cache } from "../common/persistent-cache";

export class ConfluenceSearchProvider {
  private _cache: Cache<String>;

  constructor(private readonly _context: ExtensionContext, cacheSize: number) {
    this._cache = new Cache("search-cache", this._context, cacheSize);
  }

  public getCachedSearchResults = async (
    cql: string,
    reloadCache: boolean = false
  ) => {
    const cachedResponse: any = await this._cache.get(cql);
    if (cachedResponse === undefined || reloadCache) {
      const response = await this.getSearchResults(cql);
      this._cache.set(cql, JSON.stringify(response));
      return { response };
    }
    const response = JSON.parse(cachedResponse);
    return { response, cached: true };
  };

  public getSearchResults = async (cql: string) => {
    const response: any = await (
      await ConfluenceSingleton.getConfluenceObject(this._context)
    ).search(cql);
    return response;
  };

  public clearCache = async () => {
    this._cache.clearCache();
  };
}
