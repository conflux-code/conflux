import * as vscode from "vscode";
import { getBody, initialize } from "./common/commands";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "conflux" is now active!');

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
