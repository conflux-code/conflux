import Confluence from "@webda/confluence-api";
import * as vscode from "vscode";
import { getConfluenceObject } from "./confluence-util";
import { Constants } from "./constants";
import { NodeHtmlMarkdown, NodeHtmlMarkdownOptions } from "node-html-markdown";
import { writeFileSync } from "fs";

export async function initialize(
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    const { username, password } = await getInputs();
    const confluence = getConfluenceClient(username, password);
    verifyAndStoreCredentials(confluence, username, password);
  } catch (error) {
    console.log(error);
    vscode.window.showInformationMessage(
      "Something went wrong! Kindly rerun the command"
    );
  }

  function verifyAndStoreCredentials(
    confluence: Confluence,
    username: string,
    password: string
  ): void {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Testing credentials",
        cancellable: false,
      },
      async (progress, token) => {
        progress.report({
          increment: 20,
          message: "Testing your credentials",
        });
        await confluence.fetch(Constants.baseUri + "/rest/api/user/current");
        progress.report({
          increment: 100,
          message: "Credentials verified! Storing them safely.",
        });
        await context.secrets.store(username, password);
        await context.globalState.update(Constants.userNameKey, username);
        vscode.window.showInformationMessage("Credentials Verified!");
      }
    );
  }

  async function getInputs(): Promise<{ username: string; password: string }> {
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
  }

  function getConfluenceClient(username: string, password: string): Confluence {
    let config = {
      username,
      password,
      baseUrl: Constants.baseUri,
    };
    const confluence = new Confluence(config);
    return confluence;
  }
}

export async function getBody(context: vscode.ExtensionContext) {
  try {
    const confluence = await getConfluenceObject(context);
    const response = await confluence.search(
      'cql=(text ~ "dev staging deprecation")'
    );
    const id = response["results"][0]["content"]["id"];
    const response2 = await confluence.getCustomContentById({
      id,
      expanders: ["body.styled_view"],
    }); //body.storage

    const markdown = NodeHtmlMarkdown.translate(
      response2["body"]["styled_view"]["value"],
      {},
      undefined
    );
    writeFileSync(
      "test.html",
      unescape(response2["body"]["styled_view"]["value"])
    ); // storage
    vscode.window.showInformationMessage("check file bro!");
  } catch (error) {
    console.log(error);
    vscode.window.showErrorMessage("failed bro!");
  }
}
