import * as vscode from "vscode";
import * as LRU from "lru-cache";
import { TextDecoder, TextEncoder } from "util";
import LRUCache = require("lru-cache");
import { UserMessages } from "./user-messages";

export class Cache<T> {
  private _lru: LRU<string, T>;

  constructor(
    public id: string,
    private readonly _context: vscode.ExtensionContext,
    n: number
  ) {
    this.id = id;
    this._createCacheDirectory();
    this._lru = new LRUCache({ max: n });
    this._loadCache();
  }

  public set = async (key: string, value: T) => {
    const success: boolean = this._lru.set(key, value);
    this._saveCache();
    return success;
  };

  public get = async (key: string) => {
    return this._lru.get(key);
  };

  public has = async (key: string) => {
    return this._lru.has(key);
  };

  public clearCache = async () => {
    this._lru.reset();
    this._deleteCacheFile();
  };

  private _createCacheDirectory = async () => {
    try {
      await vscode.workspace.fs.createDirectory(this._context.globalStorageUri);
    } catch (error) {
      console.warn(UserMessages.applicationStorageFailure);
    }
  };

  private _loadCache = async () => {
    try {
      const dump = await vscode.workspace.fs.readFile(
        vscode.Uri.joinPath(this._context.globalStorageUri, this.id)
      );
      this._lru.load(JSON.parse(new TextDecoder().decode(dump)));
    } catch (error) {
      console.warn(UserMessages.cachePersistenceFailure + ": {}", this.id);
    }
  };

  private _saveCache = async () => {
    try {
      const dump = new TextEncoder().encode(JSON.stringify(this._lru.dump()));
      vscode.workspace.fs.writeFile(
        vscode.Uri.joinPath(this._context.globalStorageUri, this.id),
        dump
      );
    } catch (error) {
      console.warn(UserMessages.cacheLoadFailure + ": {}", this.id);
    }
  };

  private _deleteCacheFile = async () => {
    try {
      vscode.workspace.fs.delete(
        vscode.Uri.joinPath(this._context.globalStorageUri, this.id)
      );
    } catch (error) {
      console.warn(UserMessages.cacheDeletionFailure + ": {}", this.id);
    }
  };
}
