import { ExtensionContext } from "vscode";
import { Cache } from "./PersistentCache";
import { ConfluenceSingleton } from "./confluence-singleton";

export class ConfluenceContentProvider {
  private _cache: Cache;

  constructor(private readonly _context: ExtensionContext, cacheSize: number) {
    this._cache = new Cache(this._context, cacheSize);
  }

  public getCachedBodyViewById = async (id: any) => {
    let response: any = await this._cache.get(id);
    if (response === undefined) {
      let response = await this.getBodyViewById(id);
      this._cache.set(id, JSON.stringify(response));
      console.log(response);
      return response;
    }
    return JSON.parse(response);
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

  private _getDetailsFromResponse = (response: any) => {
    const html = escape(response["body"]["view"]["value"]);
    const baseUrl = response["_links"]["base"];
    const pageUrl = response["_links"]["webui"];
    const title = response["title"];
    return { html, baseUrl, pageUrl, title };
  };
}
