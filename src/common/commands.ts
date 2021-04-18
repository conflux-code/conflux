import Confluence from "@webda/confluence-api";
import * as vscode from "vscode";
import { ConfluenceSingleton } from "./confluence-singleton";
import { Constants } from "./constants";

export async function initialize(
  context: vscode.ExtensionContext
): Promise<void> {
  const { username, password } = await getInputs();
  const confluence = ConfluenceSingleton.createConfluenceObj(
    username,
    password
  );
  await verifyAndStoreCredentials(context, confluence, username, password);
}

const verifyAndStoreCredentials = async (
  context: vscode.ExtensionContext,
  confluence: Confluence,
  username: string,
  password: string
): Promise<void> => {
  await confluence.fetch(Constants.baseUri + Constants.currentUserPath);
  await context.secrets.store(username, password);
  await context.secrets.store(Constants.userNameKey, username);
  vscode.window.showInformationMessage("Credentials Verified!");
};

const getInputs = async (): Promise<{ username: string; password: string }> => {
  const username = await vscode.window.showInputBox({
    prompt: "Confluence Username",
  });
  const password = await vscode.window.showInputBox({
    prompt: "Confluence Passsword",
    password: true,
  });
  if (username === undefined || password === undefined) {
    throw new Error("Invalid Input");
  }
  return { username, password };
};