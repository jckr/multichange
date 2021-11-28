//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

export class WebView {
  // type definitions
  /**
   * @typedef {Object} Change
   * @property {string} [matcher = '']
   * @property {string} [resolver = '']
   * @property {boolean} [isCaseSensitive = false]
   * @property {boolean} [isWholeWords = false]
   * @property {boolean} [isUsingRegEx = false]
   */

  /**
   * @typedef {Object} ElementSpec
   * @property {string} type
   * @property {string} [appearance]
   * @property {string} [value]
   * @property {string} [className]
   * @property {string} [placeholder]
   * @property {string} [ariaLabel]
   * @property {string} [role]
   * @property {function} [onclick]
   * @property {function} [onchange]
   * @property {Array<ElementSpec>} [children]
   */

  /** @type {Array<Change>} */
  changes = [];

  /**
   * @param {() => {getState: () => object, setState: (data: object) => void, postMessage: (message: unknown) => void }} acquireVsCodeApi
   */
  constructor(acquireVsCodeApi) {
    this._vscode = acquireVsCodeApi();
    this.init();
  }

  init = () => {
    const oldState = this._vscode.getState() || {changes: []};
    this.changes = oldState.changes;

    document.querySelector('.add-change').addEventListener('click', () => {
      this.changes.push({});
      this.updateChangeList();
    });

    document.querySelector('.transform').addEventListener('click', () => {
      this._vscode.postMessage({type: 'send_changes_for_transforming', value: this.changes});
    });

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', (event) => {
      const message = event.data; // The json data that the extension sent
      switch (message.type) {
        case 'get_changes_for_transforming': {
          this._vscode.postMessage({type: 'send_changes_for_transforming', value: this.changes});
          break;
        }
        case 'get_changes_for_saving': {
          this._vscode.postMessage({type: 'send_changes_for_saving', value: this.changes});
          break;
        }
        case 'import': {
          this.changes = message.changes;
          this.updateChangeList();
          break;
        }
      }
    });

    this.updateChangeList();
  };

  /**
   * updates the UI following any update to the state
   */
  updateChangeList = () => {
    const ul = document.querySelector('ul.change-list');
    ul.textContent = '';
    for (let i = 0; i < this.changes.length; i++) {
      const change = this.changes[i];
      const li = this.createHTMLElement({
        type: 'li',
        className: 'change',
        children: [
          {
            type: 'div',
            className: 'change-options',
            children: [
              {
                type: 'div',
                className: 'multichange-input-fields',
                children: [
                  {
                    type: 'div',
                    className: 'input-block find-block',
                    children: [
                      {
                        type: 'vscode-text-field',
                        className: 'find',
                        placeholder: 'Find',
                        value: change.matcher,
                        onchange: this.handleChange('matcher', i),
                      },
                      {
                        type: 'div',
                        className: 'find-options',
                        children: [
                          {
                            type: 'vscode-button',
                            appearance: 'icon',
                            ariaLabel: 'Match case',
                            onclick: this.handleClick('isCaseSensitive', i),
                            children: [
                              {
                                type: 'span',
                                className: `codicon codicon-case-sensitive${
                                  change.isCaseSensitive ? ' set' : ''
                                }`,
                              },
                            ],
                          },
                          {
                            type: 'vscode-button',
                            appearance: 'icon',
                            ariaLabel: 'Match whole word',
                            onclick: this.handleClick('isWholeWords', i),
                            children: [
                              {
                                type: 'span',
                                className: `codicon codicon-whole-word${
                                  change.isWholeWords ? ' set' : ''
                                }`,
                              },
                            ],
                          },
                          {
                            type: 'vscode-button',
                            appearance: 'icon',
                            ariaLabel: 'Use regular expression',
                            onclick: this.handleClick('isUsingRegEx', i),
                            children: [
                              {
                                type: 'span',
                                className: `codicon codicon-regex ${
                                  change.isUsingRegEx ? ' set' : ''
                                }`,
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    type: 'div',
                    className: 'input-block replace-block',
                    children: [
                      {
                        type: 'vscode-text-field',
                        className: 'replace',
                        placeholder: 'Replace',
                        value: change.resolver,
                        onchange: this.handleChange('resolver', i),
                      },
                    ],
                  },
                ],
              },
              {
                type: 'div',
                className: 'rank-options',
                children: [
                  {
                    type: 'vscode-button',
                    appearance: 'icon',
                    ariaLabel: 'Move up',
                    children: [
                      {
                        type: 'span',
                        className: `codicon codicon-arrow-up${i === 0 ? ' disabled' : ''}`,
                      },
                    ],
                    onclick: i > 0 ? this.reorder(i, i - 1) : () => {},
                  },
                  {
                    type: 'vscode-button',
                    appearance: 'icon',
                    ariaLabel: 'Delete item',
                    children: [{type: 'span', className: `codicon codicon-trash`}],
                    onclick: this.remove(i),
                  },
                  {
                    type: 'vscode-button',
                    appearance: 'icon',
                    ariaLabel: 'Move down',
                    children: [
                      {
                        type: 'span',
                        className: `codicon codicon-arrow-down${
                          i === this.changes.length - 1 ? ' disabled' : ''
                        }`,
                      },
                    ],
                    onclick: i < this.changes.length - 1 ? this.reorder(i, i + 1) : () => {},
                  },
                ],
              },
            ],
          },
          {type: 'vscode-divider'},
        ],
      });
      ul.appendChild(li);
    }
    // Update the saved state
    this._vscode.setState({changes: this.changes});
  };

  /**
   * @param {string} property
   * @param {number} i
   */
  handleChange = (property, i) => {
    /**
     * @param {Event} e;
     */
    return (e) => {
      const target = e.currentTarget;
      // updates this property based on the value of the input element
      this.changes[i][property] = /** @type {HTMLInputElement} */ (target).value;
      this.updateChangeList();
    };
  };

  /**
   * @param {string} property
   * @param {number} i
   */
  handleClick = (property, i) => {
    // toggles the value of this property
    return () => {
      this.changes[i][property] = !this.changes[i][property];
      this.updateChangeList();
    };
  };

  /**
   * Inverts the position of 2 elements in the array
   * @param {number} pos1
   * @param {number} pos2
   */
  reorder = (pos1, pos2) => {
    return () => {
      const change1 = {...this.changes[pos1]};
      this.changes[pos1] = {...this.changes[pos2]};
      this.changes[pos2] = change1;
      this.updateChangeList();
    };
  };

  /**
   * Removes the selected element from the array
   * @param {number} pos
   */
  remove = (pos) => {
    return () => {
      this.changes.splice(pos, 1);
      this.updateChangeList();
    };
  };

  /**
   * Utility function to create elements from specifications
   * @param {ElementSpec} spec
   */
  createHTMLElement = (spec) => {
    const {type, children, ariaLabel, ...attributes} = spec;
    const el = document.createElement(type);
    for (const attributeName in attributes) {
      el[attributeName] = attributes[attributeName];
    }
    if (ariaLabel) {
      el.setAttribute('aria-label', ariaLabel);
      el.title = ariaLabel;
    }
    if (children) {
      for (const child of children) {
        const childEl = this.createHTMLElement(child);
        el.append(childEl);
      }
    }
    return el;
  };
}

// @ts-ignore
const main = new WebView(acquireVsCodeApi);
