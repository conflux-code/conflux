import * as vscode from "vscode";
import { initialize } from "./common/commands";
import { ConfluenceSingleton } from "./common/confluence-singleton";
import { DocumentViewProvider } from "./DocumentViewProvider";
import { SearchPanel } from "./SearchPanel";
import { SidebarProvider } from "./SidebarProvider";
import { ConfluenceContentProvider } from "./common/ConfluenceContentProvider";

export async function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  const contentProvider = new ConfluenceContentProvider(context, 20);
  let isLoggedIn: boolean = true;
  try {
    await ConfluenceSingleton.getConfluenceObject(context);
  } catch (error) {
    isLoggedIn = false;
  }
  sidebarProvider.setLoggedIn(isLoggedIn);
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
      async ({ text, cql }) => {
        let response: any;
        if (cql) {
          response = await (
            await ConfluenceSingleton.getConfluenceObject(context)
          ).search(`cql=(${text})`);
        } else {
          response = await (
            await ConfluenceSingleton.getConfluenceObject(context)
          ).search(`cql=(text ~ "${text}" AND type="page")`);
        }
        SearchPanel.currentPanel?._panel.webview.postMessage({ response });
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("conflux.document", async (id) => {
      DocumentViewProvider.createOrShow(context.extensionUri);
      DocumentViewProvider.currentPanel?.panel.webview.postMessage(
        await contentProvider.getCachedBodyViewById(id)
      );
    })
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
