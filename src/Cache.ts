import * as vscode from "vscode";
import * as LRU from "lru-cache";
import { TextDecoder, TextEncoder } from "util";

export class Cache {
  private _lru: LRU<string, string> = new LRU({ max: 20 });

  constructor(private readonly _context: vscode.ExtensionContext) {
    this._createCacheDirectory();
  }

  public set = async (key: string, value: string) => {
    this._lru.set(key, value);
  };

  public get = async (key: string) => {
    return this._lru.get(key);
  };

  private _createCacheDirectory = async () => {
    console.log(this._context.globalStorageUri);
    await vscode.workspace.fs.createDirectory(this._context.globalStorageUri);
  };

  public _loadCache = async () => {
    const dump = await vscode.workspace.fs.readFile(
      vscode.Uri.joinPath(this._context.globalStorageUri, "cache")
    );
    this._lru.load(JSON.parse(new TextDecoder().decode(dump)));
  };

  public _saveCache = async () => {
    const dump = new TextEncoder().encode(JSON.stringify(this._lru.dump()));
    await vscode.workspace.fs.writeFile(
      vscode.Uri.joinPath(this._context.globalStorageUri, "cache"),
      dump
    );
  };
}
