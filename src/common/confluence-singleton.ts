import Confluence from "@webda/confluence-api";
import * as vscode from "vscode";
import { Constants } from "./constants";

export class ConfluenceSingleton {
  private static confluence: Confluence | undefined;

  public static getConfluenceObject = async (
    context: vscode.ExtensionContext
  ): Promise<Confluence> => {
    if (ConfluenceSingleton.confluence !== undefined) {
      return ConfluenceSingleton.confluence;
    }
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

    return ConfluenceSingleton.createConfluenceObj(username, password);
  };

  public static createConfluenceObj(username: string, password: string) {
    let config = {
      username,
      password,
      baseUrl: Constants.baseUri,
    };
    ConfluenceSingleton.confluence = new Confluence(config);
    return ConfluenceSingleton.confluence;
  }
}
