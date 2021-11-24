import {
    Range,
    TextEditor,
    window,
    workspace,
  } from 'vscode';

/**
 * A helper function which will read the entire text of an editor.
 *
 * @param editor the editor from which the text is read
 * @returns A string containing the text
 */
export function getWholeText(editor: TextEditor) {
    const document = editor.document;
    return document.getText();
  }
  
/**
 * A helper function which will return a range from the beginning to the end of a given editor
 *
 * @param editor the editor from which the range is computed.
 * @returns A TextDocument Range
 */
  export function getRangeOfEntireDocument(editor: TextEditor) {
    const firstLine = editor.document.lineAt(0);
    const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
    return new Range(firstLine.range.start, lastLine.range.end);
  }
  
  /**
 * A helper function to write a text in a new tab. 
 *
 * @param content the text to be written
 * @param language the language for syntax highlighting, etc. 
 */
  export async function openInUntitled(content: string, language?: string) {
    const document = await workspace.openTextDocument({
      language,
      content,
    });
    window.showTextDocument(document);
  }