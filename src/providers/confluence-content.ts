import { HTMLElement, parse } from "node-html-parser";
import * as vscode from "vscode";
import { ExtensionContext } from "vscode";
import { ConfluenceSingleton } from "../common/confluence-singleton";
import { Constants } from "../common/constants";
import { Cache } from "../common/persistent-cache";
import { DocumentViewProvider } from "../DocumentViewProvider";

export class ConfluenceContentProvider {
  private _pageCache: Cache<String>;
  private _imageCache: Cache<Buffer>;
  private _imageStorageDirectory: vscode.Uri;

  constructor(
    private readonly _context: ExtensionContext,
    cacheSize: number,
    storageDirectory: vscode.Uri
  ) {
    this._pageCache = new Cache("page-cache", this._context, cacheSize);
    this._imageStorageDirectory = storageDirectory;
    this._imageCache = new Cache("image-cache", this._context, 100);
  }

  public isPageDownloaded = async (id: string) => {
    return this._pageCache.has(id);
  };

  public getCachedBodyViewById = async (id: any, reload: boolean = false) => {
    const cachedResponse: any = await this._pageCache.get(id);
    let response: any;
    if (cachedResponse === undefined || reload) {
      response = await this.getBodyViewById(id);
      this._pageCache.set(id, JSON.stringify(response));
      response = await this.getCachedBodyViewWithUpdatedImageInfo(response);
    } else {
      response = await this.getCachedBodyViewWithUpdatedImageInfo(
        JSON.parse(cachedResponse)
      );
    }
    return {
      cached: id,
      ...response,
    };
  };

  public getBodyViewById = async (id: any) => {
    const response = await (
      await ConfluenceSingleton.getConfluenceObject(this._context)
    ).getCustomContentById({
      id,
      expanders: ["body.view"],
    });
    return this._getDetailsFromResponse(response);
  };

  public clearCache = async () => {
    this._pageCache.clearCache();
    this._imageCache.clearCache();
  };

  private _getDetailsFromResponse = async (response: any) => {
    const html = escape(response["body"]["view"]["value"]);
    const baseUrl = response["_links"]["base"];
    const pageUrl = response["_links"]["webui"];
    const title = response["title"];
    return { html, baseUrl, pageUrl, title };
  };

  private _storeImagesAndGetUpdatedHtml = async (
    html: any
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
        let imageBuffer: Buffer | undefined = await this._imageCache.get(
          imgUrl
        );
        if (imageBuffer === undefined) {
          imageBuffer = await confluence.fetch(
            Constants.baseUri + imgUrl,
            "GET",
            false
          );
          if (imageBuffer === undefined) {
            return null;
          }
          this._imageCache.set(imgUrl, imageBuffer);
        }
        const imgPath = vscode.Uri.joinPath(
          this._imageStorageDirectory,
          image.getAttribute("data-linked-resource-default-alias") || "sample"
        );
        try {
          await vscode.workspace.fs.stat(imgPath);
        } catch (error) {
          await vscode.workspace.fs.writeFile(imgPath, imageBuffer);
        }
        const webviewUri = DocumentViewProvider.currentPanel?._panel.webview.asWebviewUri(
          imgPath
        );
        if (webviewUri === undefined) {
          return null;
        }
        image.setAttribute("src", webviewUri.toString());
        image.setAttribute("data-image-src", webviewUri.toString());
        image.removeAttribute("data-base-url");
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
