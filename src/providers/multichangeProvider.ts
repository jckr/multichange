import {
  CancellationToken,
  Uri,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
  window,
  workspace,
  WorkspaceEdit,
} from 'vscode';

import {getWebviewContent} from '../ui/getWebViewContent';
import {getWholeText, openInUntitled, getRangeOfEntireDocument} from '../utilities/textHelpers';

type Change = {
  matcher: string;
  resolver: string;
  isCaseSensitive: boolean;
  isWholeWords: boolean;
  isUsingRegEx: boolean;
};

export class MultichangeViewProvider implements WebviewViewProvider {
  public static readonly viewType = 'multichange.multichangeView';

  constructor(private readonly _extensionUri: Uri) {}

  private _view?: WebviewView;

  public resolveWebviewView(
    webviewView: WebviewView,
    context: WebviewViewResolveContext,
    _token: CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
    };

    webviewView.webview.html = getWebviewContent(webviewView.webview, this._extensionUri);

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case 'send_changes_for_transforming': {
          this._handleTransform(data.value.changes, data.value.multiEditor);
          break;
        }
        case 'send_changes_for_saving': {
          this._handleSave(data.value);
          break;
        }
      }
    });
  }

  // these public functions can be called from outside the class (see subscriptions of extension.ts)
  // they send a message to the webview.
  public import() {
    if (this._view) {
      const editor = window.activeTextEditor;
      if (!editor) {
        return window.showWarningMessage(`No active text editor.`);
      }
      const text = getWholeText(editor);
      const rawchanges = JSON.parse(text);
      if (!Array.isArray(rawchanges)) {
        return window.showWarningMessage(
          'The active text editor does not contain a valid multichange description - not an array of changes'
        );
      }  
      const changes = rawchanges.map(change => ({
        matcher: change.matcher || '',
        resolver: change.resolver || '',
        isCaseSensitive: change.isCaseSensitive || false,
        isWholeWords: change.isWholeWords || false,
        isUsingRegEx: change.isUsingRegEx || false
      }))
      this._view.webview.postMessage({type: 'import', changes});
    }
  }

  public save() {
    if (this._view && this._view.webview) {
      this._view.webview.postMessage({type: 'get_changes_for_saving'});
    }
  }

  public transform() {
    if (this._view && this._view.webview) {
      this._view.webview.postMessage({type: 'get_changes_for_transforming'});
    }
  }

  // these private functions are only called by the class, as a result of receiving a message from the webview.
  private _handleSave(changes: Array<Change>) {
    openInUntitled(JSON.stringify(changes, null, 2), 'json');
  }

  private _handleTransform(changes: Array<Change>, multiEditor: boolean){
    if (multiEditor) {
      const documents = workspace.textDocuments;
      const replacers = getReplacers(changes);
      for (const document of documents) {
        const edit = new WorkspaceEdit();
        let text = document.getText();
        for (const replacer of replacers) {
          text = replacer(text);
        }
        edit.replace(document.uri, getRangeOfEntireDocument(document), text);
        new Promise((resolve) => resolve(workspace.applyEdit(edit)));
      }
    } else {
      if (!window.activeTextEditor) {
        return window.showWarningMessage('No active text editor');
      }
      const replacers = getReplacers(changes);

      const editor = window.activeTextEditor;
        let text = getWholeText(editor);
        for (const replacer of replacers) {
          text = replacer(text);
        }
        const rangeOfEntireDocument = getRangeOfEntireDocument(editor.document);
        editor.edit((editBuilder) => editBuilder.replace(rangeOfEntireDocument, text));
    }
  }
}

function getReplacers(changes: Array<Change>) {
  return changes.map((change) => {
    const flags = change.isCaseSensitive ? 'gm' : 'gim';
    const coreMatcher = change.isUsingRegEx
      ? change.matcher
      : change.matcher.replace(/[#-.]|[[-^]|[?|{}]/g, '\\$&');
    const matcher = change.isWholeWords ? `\\b${coreMatcher}\\b` : coreMatcher;
    return (t: string) => t.replace(new RegExp(matcher, flags), change.resolver);
  });
}