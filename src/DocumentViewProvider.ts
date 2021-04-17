import * as vscode from "vscode";
import { Constants } from "./common/constants";
import { getNonce } from "./getNonce";

export class DocumentViewProvider {
  public static currentPanel: DocumentViewProvider | undefined;

  public static readonly viewType = "document-view";

  public readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, imagesUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (DocumentViewProvider.currentPanel) {
      DocumentViewProvider.currentPanel._panel.reveal(column);
      DocumentViewProvider.currentPanel._update();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      DocumentViewProvider.viewType,
      "Conflux Search",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          imagesUri,
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "out/compiled"),
          vscode.Uri.joinPath(extensionUri),
        ],
      }
    );

    DocumentViewProvider.currentPanel = new DocumentViewProvider(
      panel,
      extensionUri
    );
  }

  public static kill() {
    DocumentViewProvider.currentPanel?.dispose();
    DocumentViewProvider.currentPanel = undefined;
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    DocumentViewProvider.currentPanel = new DocumentViewProvider(
      panel,
      extensionUri
    );
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._update();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public dispose() {
    DocumentViewProvider.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private async _update() {
    const webview = this._panel.webview;

    this._panel.webview.html = this._getHtmlForWebview(webview);
    webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "onInfo": {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled", "Document.js")
    );
    const stylesResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const stylesMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <base href="${Constants.baseUri}">
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${stylesResetUri}" rel="stylesheet">
        <link href="${stylesMainUri}" rel="stylesheet">
        <script>
        </script>
      </head>
      <body>
      </body>
      <script src="${scriptUri}" nonce="${nonce}">
      </html>`;
  }
}
