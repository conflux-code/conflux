import * as vscode from "vscode";
import Confluence from "@webda/confluence-api";
import { SearchPanel } from "./SearchPanel";
import { SidebarProvider } from "./SidebarProvider";
import { DocumentViewProvider } from "./DocumentViewProvider";
import { getBody, initialize } from "./common/commands";

export function activate(context: vscode.ExtensionContext) {
  let config = {
    username: "madhurjya.r",
    password: "password",
    baseUrl: "https://confluence.endurance.com",
    version: 6,
  };

  const confluence = new Confluence(config);
  const sidebarProvider = new SidebarProvider(context.extensionUri);

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
    vscode.commands.registerCommand("conflux.document", () => {
      DocumentViewProvider.createOrShow(context.extensionUri);
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
    vscode.commands.registerCommand("conflux.initialize", () =>
      initialize(context)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("conflux.getBodyTest", () =>
      getBody(context)
    )
  );
}

export function deactivate() {}
function data(arg0: string, data: any) {
  vscode.window.showInformationMessage("Thanks for using conflux");
}
