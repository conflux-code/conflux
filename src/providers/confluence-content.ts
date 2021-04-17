import { ExtensionContext } from "vscode";
import { Cache } from "../common/persistent-cache";
import { ConfluenceSingleton } from "../common/confluence-singleton";

export class ConfluenceContentProvider {
  private _cache: Cache;

  constructor(private readonly _context: ExtensionContext, cacheSize: number) {
    this._cache = new Cache("page-cache", this._context, cacheSize);
  }

  public getCachedBodyViewById = async (
    id: any,
    reloadCache: boolean = false
  ) => {
    const cachedResponse: any = await this._cache.get(id);
    if (cachedResponse === undefined || reloadCache) {
      const response = await this.getBodyViewById(id);
      this._cache.set(id, JSON.stringify(response));
      return response;
    }
    const response = JSON.parse(cachedResponse);
    return {
      html: response["html"],
      baseUrl: response["baseUrl"],
      pageUrl: response["pageUrl"],
      title: response["title"],
      cached: id,
    };
  };

  public getBodyViewById = async (id: any) => {
    const response = await (
      await ConfluenceSingleton.getConfluenceObject(this._context)
    ).getCustomContentById({
      id,
      expanders: ["body.view", "space"],
    });
    return this._getDetailsFromResponse(response);
  };

  public clearCache = async () => {
    this._cache.clearCache();
  };

  private _getDetailsFromResponse = (response: any) => {
    const html = escape(response["body"]["view"]["value"]);
    const baseUrl = response["_links"]["base"];
    const pageUrl = response["_links"]["webui"];
    const title = response["title"];
    return { html, baseUrl, pageUrl, title };
  };
}
