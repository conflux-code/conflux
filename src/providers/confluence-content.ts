import { randomInt } from "crypto";
import { HTMLElement, parse } from "node-html-parser";
import { ExtensionContext } from "vscode";
import { ConfluenceSingleton } from "../common/confluence-singleton";
import { Constants } from "../common/constants";
import { Cache } from "../common/persistent-cache";
import { DocumentViewProvider } from "../DocumentViewProvider";
export class ConfluenceContentProvider {
  private _pageCache: Cache<string>;
  private _imageDataCache: Cache<string>;

  constructor(private readonly _context: ExtensionContext, cacheSize: number) {
    this._pageCache = new Cache("page-cache", this._context, cacheSize);
    this._imageDataCache = new Cache("image-cache", this._context, cacheSize);
  }

  public isPageDownloaded = async (id: string) => {
    return this._pageCache.has(id);
  };

  public getCachedBodyViewById = async (
    id: string,
    reload: boolean = false
  ) => {
    try {
      const cachedResponse: any = await this._pageCache.get(id);
      let response: any;
      if (cachedResponse === undefined || reload) {
        response = await this.getBodyViewById(id);
        response = await this.getCachedBodyViewWithUpdatedImageInfo(
          response,
          id
        );
        this._pageCache.set(id, JSON.stringify(response));
        return response;
      }
      return {
        cached: id,
        ...(await this.getCachedBodyViewWithCachedImageInfo(
          JSON.parse(cachedResponse)
        )),
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
      expanders: [`body.${Constants.confluenceContentViewType}`],
    });
    return this._getDetailsFromResponse(response);
  };

  private _getDetailsFromResponse = async (response: any) => {
    const html = escape(
      response["body"][`${Constants.confluenceContentViewType}`]["value"]
    );
    const baseUrl = response["_links"]["base"];
    const pageUrl = response["_links"]["webui"];
    const title = response["title"];
    return { html, baseUrl, pageUrl, title };
  };

  private getCachedBodyViewWithUpdatedImageInfo = async (
    response: any,
    pageId: string
  ) => {
    let { html, ...others } = response;
    html = await this._storeImagesAndGetUpdatedHtml(html, pageId);
    return {
      html,
      ...others,
    };
  };

  private _storeImagesAndGetUpdatedHtml = async (
    html: string,
    pageId: string
  ): Promise<string> => {
    let htmlParsed: HTMLElement = parse(unescape(html));
    await Promise.all(
      htmlParsed.querySelectorAll("img").map(async (image) => {
        let imgUrl: string | undefined = image.getAttribute("data-image-src");
        if (imgUrl === undefined) {
          return;
        }
        let contentType = image.getAttribute(
          "data-linked-resource-content-type"
        );
        if (contentType === undefined) {
          return;
        }
        let imgId = image.getAttribute(Constants.customImageIdAttribute);
        if (imgId === null || imgId === undefined) {
          imgId = "imgId~" + pageId + "~" + randomInt(0, 1000000);
        }
        this._loadImageAsyncAndCache(image, imgUrl, imgId, contentType);
        let html = `<div ${Constants.customImageIdAttribute}="${imgId}">
                      <div class="lds-ripple">
                        <div></div>
                        <div></div>
                      </div>
                    </div>`;
        const parentNode = image.parentNode;
        parentNode.removeChild(image);
        parentNode.appendChild(parse(html));
        return;
      })
    );
    return htmlParsed.toString();
  };

  private _loadImageAsyncAndCache = async (
    image: HTMLElement,
    imgUrl: string,
    imgId: string,
    contentType: string
  ) => {
    const confluence = await ConfluenceSingleton.getConfluenceObject(
      this._context
    );

    let imageBuffer = await confluence.fetch(
      imgUrl.indexOf(ConfluenceSingleton.getBaseUrl()) === 0
        ? imgUrl
        : ConfluenceSingleton.getBaseUrl() +
            (imgUrl.startsWith("/confluence")
              ? imgUrl.slice("/confluence".length, imgUrl.length)
              : imgUrl),
      "GET",
      false
    );
    if (imageBuffer === undefined) {
      return null;
    }
    let base64Image = imageBuffer.toString("base64");
    const dataUrl = "data:" + contentType + ";base64," + base64Image;
    image.setAttribute("src", dataUrl);
    DocumentViewProvider.currentPanel?.updateImage({ image, imgId });
    this._imageDataCache.set(imgId, image.toString());
  };

  private getCachedBodyViewWithCachedImageInfo = async (response: any) => {
    let { html, ...others } = response;
    let htmlParsed = parse(html);
    await Promise.all(
      htmlParsed
        .querySelectorAll("[data-confluxId]")
        .map(async (divElement: HTMLElement) => {
          let imgId = divElement.getAttribute(Constants.customImageIdAttribute);
          if (imgId === undefined) {
            return;
          }
          let cachedImageHTML = await this._imageDataCache.get(imgId);
          if (cachedImageHTML === undefined) {
            return;
          }
          divElement.innerHTML = cachedImageHTML;
          return;
        })
    );
    return {
      html: htmlParsed.toString(),
      ...others,
    };
  };

  public clearCache = async () => {
    this._pageCache.clearCache();
    this._imageDataCache.clearCache();
  };
}
