import Confluence from "@webda/confluence-api";
import * as vscode from "vscode";
import { ConfluenceSingleton } from "./confluence-singleton";
import { Constants } from "./constants";

export async function initialize(
  context: vscode.ExtensionContext
): Promise<void> {
  const { baseUrl, username, password } = await getInputs();
  const confluence = ConfluenceSingleton.createConfluenceObj(
    baseUrl,
    username,
    password
  );
  await verifyAndStoreCredentials(context, confluence, baseUrl, username, password);
}

const verifyAndStoreCredentials = async (
  context: vscode.ExtensionContext,
  confluence: Confluence,
  baseUrl: string,
  username: string,
  password: string
): Promise<void> => {
  await confluence.fetch(baseUrl + Constants.currentUserPath);
  await context.secrets.store(username, password);
  await context.secrets.store(Constants.userNameKey, username);
  await context.secrets.store(Constants.baseUriKey, baseUrl);
  vscode.window.showInformationMessage("Credentials Verified!");
};

const getInputs = async (): Promise<{ baseUrl: string, username: string; password: string }> => {
  const baseUrl = await vscode.window.showInputBox({
    prompt: "Confluence Base URL",
  });
  const username = await vscode.window.showInputBox({
    prompt: "Confluence Username",
  });
  const password = await vscode.window.showInputBox({
    prompt: "Confluence Passsword",
    password: true,
  });
  if (username === undefined || password === undefined || baseUrl === undefined) {
    throw new Error("Invalid Input");
  }
  return { baseUrl, username, password };
};