import { HTMLElement, parse } from "node-html-parser";
import * as vscode from "vscode";
import { ExtensionContext } from "vscode";
import { ConfluenceSingleton } from "../common/confluence-singleton";
import { Constants } from "../common/constants";
import { Cache } from "../common/persistent-cache";
export class ConfluenceContentProvider {
  private _pageCache: Cache<String>;

  constructor(private readonly _context: ExtensionContext, cacheSize: number) {
    this._pageCache = new Cache("page-cache", this._context, cacheSize);
  }

  public isPageDownloaded = async (id: string) => {
    return this._pageCache.has(id);
  };

  public getCachedBodyViewById = async (id: any, reload: boolean = false) => {
    try {
      const cachedResponse: any = await this._pageCache.get(id);
      let response: any;
      if (cachedResponse === undefined || reload) {
        response = await this.getBodyViewById(id);
        response = await this.getCachedBodyViewWithUpdatedImageInfo(response);
        this._pageCache.set(id, JSON.stringify(response));
        return response;
      }
      return {
        cached: id,
        ...JSON.parse(cachedResponse),
      };
    } catch (error) {
      console.log(`error: ${error}`);
    }
  };

  public getBodyViewById = async (id: any) => {
    const response = await (
      await ConfluenceSingleton.getConfluenceObject(this._context)
    ).getCustomContentById({
      id,
      expanders: ["body.styled_view"],
    });
    return this._getDetailsFromResponse(response);
  };

  public clearCache = async () => {
    this._pageCache.clearCache();
  };

  private _getDetailsFromResponse = async (response: any) => {
    const html = escape(response["body"]["styled_view"]["value"]);
    const baseUrl = response["_links"]["base"];
    const pageUrl = response["_links"]["webui"];
    const title = response["title"];
    return { html, baseUrl, pageUrl, title };
  };

  private _storeImagesAndGetUpdatedHtml = async (
    html: string
  ): Promise<string> => {
    let htmlParsed: HTMLElement = parse(unescape(html));
    await Promise.all(
      htmlParsed.querySelectorAll("img").map(async (image) => {
        let imgUrl: string | undefined = image.getAttribute("src");
        if (imgUrl === undefined) {
          return;
        }
        const confluence = await ConfluenceSingleton.getConfluenceObject(
          this._context
        );

        let imageBuffer = await confluence.fetch(
          imgUrl.indexOf(Constants.baseUri) === 0 ? imgUrl : Constants.baseUri + imgUrl,
          "GET",
          false
        );
        if (imageBuffer === undefined) {
          return null;
        }
        let base64Image = imageBuffer.toString("base64");
        let contentType = image.getAttribute(
          "data-linked-resource-content-type"
        );
        const dataUrl = "data:" + contentType + ";base64," + base64Image;
        image.setAttribute("src", dataUrl);
        return image;
      })
    );
    return htmlParsed.toString();
  };

  private getCachedBodyViewWithUpdatedImageInfo = async (response: any) => {
    let { html, ...others } = response;
    html = await this._storeImagesAndGetUpdatedHtml(html);
    return {
      html,
      ...others,
    };
  };
}

const onDispose = async (imgPath: string, _imgBuffer: any): Promise<void> => {
  try {
    const imgUri = vscode.Uri.parse(imgPath);
    console.log(`deleting ${imgPath}`);
    await vscode.workspace.fs.delete(imgUri);
    console.log("successfully deleted");
  } catch (error) {
    console.log(`Error:${error}`);
  }
};
