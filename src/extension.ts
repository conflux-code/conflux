import * as vscode from "vscode";
import { initialize } from "./common/commands";
import { ConfluenceSingleton } from "./common/confluence-singleton";
import { DocumentViewProvider } from "./DocumentViewProvider";
import { ConfluenceContentProvider } from "./providers/confluence-content";
import { ConfluenceSearchProvider } from "./providers/confluence-search";
import { SearchPanel } from "./SearchPanel";
import { SidebarProvider } from "./SidebarProvider";

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  const imagesDirectoryUri = vscode.Uri.joinPath(
    context.globalStorageUri,
    "images"
  );
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  const contentProvider = new ConfluenceContentProvider(
    context,
    20,
    imagesDirectoryUri
  );
  const searchProvider = new ConfluenceSearchProvider(context, 20);

  let isLoggedIn: boolean = true;
  try {
    await ConfluenceSingleton.getConfluenceObject(context);
  } catch (error) {
    isLoggedIn = false;
  }
  sidebarProvider.setLoggedIn(isLoggedIn);
  await vscode.workspace.fs.createDirectory(context.globalStorageUri);
  await vscode.workspace.fs.createDirectory(imagesDirectoryUri);

  context.subscriptions.push(
    vscode.commands.registerCommand("conflux.helloWorld", () => {
      vscode.window.showInformationMessage("Hello World from Conflux!");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("conflux.search", () => {
      SearchPanel.createOrShow(context.extensionUri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "conflux.doSearch",
      async ({ text, cql, reload = false }) => {
        let response: any;
        if (cql) {
          response = await searchProvider.getCachedSearchResults(
            `cql=(${text})`,
            reload
          );
        } else {
          response = await searchProvider.getCachedSearchResults(
            `cql=(text ~ "${text}" AND type="page")`,
            reload
          );
        }
        await Promise.all(
          response.response.results.map(async (item: any) => {
            const isOffline = await contentProvider.isPageDownloaded(
              item.content.id
            );
            item.isOffline = isOffline;
            return item;
          })
        );
        SearchPanel.currentPanel?._panel.webview.postMessage(response);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "conflux.document",
      async ({ id, reload = false }) => {
        DocumentViewProvider.createOrShow(
          context.extensionUri,
          imagesDirectoryUri
        );
        DocumentViewProvider.currentPanel?._panel.webview.postMessage(
          await contentProvider.getCachedBodyViewById(id, reload)
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("conflux.refresh", async () => {
      // SearchPanel.kill();
      // SearchPanel.createOrShow(context.extensionUri);
      await vscode.commands.executeCommand("workbench.action.closeSidebar");
      await vscode.commands.executeCommand(
        "workbench.view.extension.conflux-sidebar-view"
      );
      setTimeout(() => {
        vscode.commands.executeCommand(
          "workbench.action.webview.openDeveloperTools"
        );
      }, 500);
    })
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "conflux-sidebar",
      sidebarProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("conflux.initialize", async () => {
      await initialize(context);
      sidebarProvider.setLoggedIn(true);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("conflux.clearCaches", async () => {
      await contentProvider.clearCache();
      await searchProvider.clearCache();
      vscode.window.showInformationMessage("Caches cleared.");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("conflux.logOut", async () => {
      await ConfluenceSingleton.closeConfluenceObjAndLogOut(context);
      vscode.window.showInformationMessage("Logged out successfully!");
      sidebarProvider.setLoggedIn(false);
    })
  );
}

export function deactivate() {}
function data(arg0: string, data: any) {
  vscode.window.showInformationMessage("Thanks for using conflux");
}
