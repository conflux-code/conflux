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
    const username: string | undefined = await context.secrets.get(
      Constants.userNameKey
    );
    if (username === undefined) {
      throw new Error("Username not found");
    }

    const password: string | undefined = await context.secrets.get(username);
    if (password === undefined) {
      throw new Error("Password not found");
    }

    const baseUrl: string | undefined = await context.secrets.get(Constants.baseUriKey);
    if (baseUrl === undefined) {
      throw new Error("BaseURL not found");
    }

    return ConfluenceSingleton.createConfluenceObj(baseUrl, username, password);
  };

  public static createConfluenceObj(baseUrl: string, username: string, password: string) {
    let config = {
      username,
      password,
      baseUrl,
    };
    ConfluenceSingleton.confluence = new Confluence(config);
    return ConfluenceSingleton.confluence;
  }

  public static async closeConfluenceObjAndLogOut(
    context: vscode.ExtensionContext
  ) {
    ConfluenceSingleton.confluence = undefined;
    const username: string | undefined = await context.secrets.get(
      Constants.userNameKey
    );
    if (username === undefined) {
      throw new Error("Username not found");
    }
    await context.secrets.delete(username);
    await context.secrets.delete(Constants.userNameKey);
  }
}
