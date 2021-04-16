import * as vscode from "vscode";
import Confluence from "@webda/confluence-api";
import { SearchPanel } from "./SearchPanel";
import { SidebarProvider } from "./SidebarProvider";
import { DocumentViewProvider } from "./DocumentViewProvider";
import { initialize } from "./common/commands";
import { ConfluenceSingleton } from "./common/confluence-singleton";
import { Constants } from "./common/constants";

export async function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new SidebarProvider(context.extensionUri);
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
    vscode.commands.registerCommand("conflux.doSearch", async (text) => {
      const response = await (
        await ConfluenceSingleton.getConfluenceObject(context)
      ).search(`cql=(text ~ "${text}" AND type="page")`);
      SearchPanel.currentPanel?._panel.webview.postMessage({ response });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("conflux.document", async (id) => {
      const response = await (
        await ConfluenceSingleton.getConfluenceObject(context)
      ).getCustomContentById({
        id,
        expanders: ["body.view", "space"],
      });
      let html = response["body"]["view"]["value"];
      html = escape(html);
      const baseUrl = response["_links"]["base"];
      const pageUrl = response["_links"]["webui"];
      const title = response["title"];
      DocumentViewProvider.createOrShow(context.extensionUri);
      DocumentViewProvider.currentPanel?._panel.webview.postMessage({
        html,
        baseUrl,
        pageUrl,
        title,
      });
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
