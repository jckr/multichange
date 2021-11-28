import { Webview, Uri } from "vscode";
import { getUri } from "../utilities/getUri";

/**
 * Defines and returns the HTML that should be rendered within the multichange webview panel.
 *
 * @remarks This is also the place where references to CSS and JavaScript files/packages
 * (such as the Webview UI Toolkit) are created and inserted into the webview HTML.
 *
 * @param webview A reference to the extension webview
 * @param extensionUri The URI of the directory containing the extension
 * @returns A template string literal containing the HTML that should be
 * rendered within the webview panel
 */
export function getWebviewContent(webview: Webview, extensionUri: Uri) {
 // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
 const scriptUri = getUri(webview, extensionUri, ['media', 'main.js']);
 // get uri to webview UI toolkit code
 const toolkitUri = getUri(webview, extensionUri, [
   'node_modules',
   '@vscode',
   'webview-ui-toolkit',
   'dist',
   'toolkit.js',
 ]);
 const codiconsUri = getUri(webview, extensionUri, [
   'node_modules',
   '@vscode/codicons',
   'dist',
   'codicon.css',
 ]);

 // Do the same for the stylesheet.
 const styleResetUri = getUri(webview, extensionUri, ['media', 'reset.css']);
 const styleVSCodeUri = getUri(webview, extensionUri, ['media', 'vscode.css']);
 const styleMainUri = getUri(webview, extensionUri, ['media', 'main.css']);

 return /*html*/ `<!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <script type="module" src="${toolkitUri}"></script>
       <link rel="stylesheet" href="${styleMainUri}">
       <link rel="stylesheet" href="${styleResetUri}">
       <link rel="stylesheet" href="${styleVSCodeUri}">
       <link rel="stylesheet" href="${codiconsUri}">
     <title>Multichange</title>
   </head>
   <body>
    <section class="changes">
      <ul class="change-list">
      </ul>
    </section>
    <div class="toggle-details">
      <vscode-button class="details" appearance="icon" ariaLabel="toggle search details">
        <span class="codicon codicon-ellipsis"></span>
      </vscode-button>
    </div>
    <section class="details">
      <div class="multi-editor">
        <div class="multi-editor-status">
          Search and replace in the active editor
        </div>
        <vscode-button class="multi-editor-toggle" ariaLabel="search/replace in the all editors">
          <div class="multi-editor-toggle-label">search/replace in all the editors</div>
          <span slot="start" class="codicon codicon-book"></span>
        </vscode-button>
      </div>
      <div class="save-import">
      <vscode-button class="save-config" appearance="secondary">Save config</vscode-button>
      <vscode-button class="import-config" appearance="secondary">Import config</vscode-button>
      </div>
      <vscode-divider></vscode-divider>
    </section>
    <section class="controls">
      <vscode-button class="add-change" appearance="secondary">Add change</vscode-button>
      <vscode-button class="transform" >Apply changes</vscode-button>
    </section>
    <script type="module" src="${scriptUri}"></script>
   </body>
   </html>`;
}
