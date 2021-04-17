import { ExtensionContext } from "vscode";
import { Cache } from "../common/persistent-cache";
import { ConfluenceSingleton } from "../common/confluence-singleton";
import * as vscode from "vscode";
import { HTMLElement, parse } from "node-html-parser";
import { Constants } from "../common/constants";
import { DocumentViewProvider } from "../DocumentViewProvider";
import * as FileType from "file-type";

export class ConfluenceContentProvider {
  private _cache: Cache;
  private _imageStorageDirectory: vscode.Uri;

  constructor(
    private readonly _context: ExtensionContext,
    cacheSize: number,
    storageDirectory: vscode.Uri
  ) {
    this._cache = new Cache("page-cache", this._context, cacheSize);
    this._imageStorageDirectory = storageDirectory;
  }

  public getCachedBodyViewById = async (id: any) => {
    const cachedResponse: any = await this._cache.get(id);
    if (cachedResponse === undefined) {
      const response = await this.getBodyViewById(id);
      this._cache.set(id, JSON.stringify(response));
      return response;
    }
    return JSON.parse(cachedResponse);
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
    this._cache.clearCache();
  };

  private _getDetailsFromResponse = async (response: any) => {
    const html = escape(
      await this._storeImagesAndGetHtml(response["body"]["view"]["value"])
    );
    const baseUrl = response["_links"]["base"];
    const pageUrl = response["_links"]["webui"];
    const title = response["title"];
    return { html, baseUrl, pageUrl, title };
  };

  private _storeImagesAndGetHtml = async (html: any): Promise<string> => {
    let htmlParsed: HTMLElement = parse(html);
    DocumentViewProvider.createOrShow(
      this._context.extensionUri,
      this._imageStorageDirectory
    );
    await Promise.all(
      htmlParsed.querySelectorAll("img").map(async (image) => {
        let imgUrl: string | undefined = image.getAttribute("src");
        if (imgUrl === undefined) {
          return;
        }
        const confluence = await ConfluenceSingleton.getConfluenceObject(
          this._context
        );
        const imgResponse = await confluence.fetch(
          Constants.baseUri + imgUrl,
          "GET",
          false
        );
        const fileType = await FileType.fromBuffer(imgResponse);
        if (fileType === undefined) {
          console.log(
            "File type could not be reliably determined! The binary data may be malformed! No file saved!"
          );
          return;
        }
        const imgPath = vscode.Uri.joinPath(
          this._context.globalStorageUri,
          "images",
          image.getAttribute("data-linked-resource-default-alias") || "sample"
        );
        await vscode.workspace.fs.writeFile(imgPath, imgResponse);
        const webviewUri = DocumentViewProvider.currentPanel?._panel.webview.asWebviewUri(
          imgPath
        );
        if (webviewUri === undefined) {
          return;
        }
        image.setAttribute("src", webviewUri.toString());
        image.setAttribute("data-image-src", webviewUri.toString());
        image.removeAttribute("data-base-url");
        return image;
      })
    );
    return htmlParsed.toString();
  };
}
