import * as vscode from "vscode";
import { ConfluenceSingleton } from "./common/confluence-singleton";
import { getNonce } from "./getNonce";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  isLoggedIn: boolean = false;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public async toggleLoggedIn() {
    this.isLoggedIn = !this.isLoggedIn;
    this._view?.webview.postMessage({ loggedIn: this.isLoggedIn });
  }

  public async setLoggedIn(status: boolean) {
    this.isLoggedIn = status;
    this._view?.webview.postMessage({ loggedIn: this.isLoggedIn });
  }

  public async resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [
        this._extensionUri,
        vscode.Uri.joinPath(this._extensionUri, "media"),
        vscode.Uri.joinPath(this._extensionUri, "out/compiled"),
      ],
    };

    webviewView.webview.html = await this._getHtmlForWebview(
      webviewView.webview
    );

    webviewView.webview.onDidReceiveMessage(async (data) => {
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
        case "activateSearch": {
          vscode.commands.executeCommand("conflux.search");
          break;
        }
        case "logOut": {
          await vscode.commands.executeCommand("conflux.logOut");
          break;
        }
        case "logIn": {
          await vscode.commands.executeCommand("conflux.initialize");
          break;
        }
        case "clearCaches": {
          vscode.commands.executeCommand("conflux.clearCaches");
          break;
        }
        case "initializeLogInStatus": {
          this._view?.webview.postMessage({ loggedIn: this.isLoggedIn });
        }
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private async _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const fontUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "Comfortaa.ttf")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled", "Sidebar.js")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled", "Sidebar.css")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();
    await webview.postMessage({ loggedIn: this.isLoggedIn });

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src https:; style-src ${webview.cspSource} https:; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleResetUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">
        <link rel="preconnect" href="https://fonts.gstatic.com">
        <link href="https://fonts.googleapis.com/css2?family=Nunito&display=swap" rel="stylesheet">
        <script nonce="${nonce}">
          const tsvscode = acquireVsCodeApi();
        </script>
      </head>
      <body>
      </body>
      <script src="${scriptUri}" nonce="${nonce}">
      </html>`;
  }
}
