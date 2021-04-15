import Confluence from "@webda/confluence-api";
import * as vscode from "vscode";
import { Constants } from "./constants";

export async function getConfluenceObject(
  context: vscode.ExtensionContext
): Promise<Confluence> {
  const username: string | undefined = await context.globalState.get(
    Constants.userNameKey
  );
  if (username === undefined) {
    throw new Error("Username not found");
  }

  const password: string | undefined = await context.secrets.get(username);
  if (password === undefined) {
    throw new Error("Password not found");
  }

  let config = {
    username,
    password,
    baseUrl: Constants.baseUri,
  };
  const confluence = new Confluence(config);
  return confluence;
}
