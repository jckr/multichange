//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

export function main() {
  {
    // @ts-ignore
    const vscode = acquireVsCodeApi();
    const oldState = vscode.getState() || {changes: []};
  
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
    let changes = oldState.changes;
  
    updateChangeList(changes);
  
    document.querySelector('.add-change').addEventListener('click', () => {
      changes.push({});
      updateChangeList(changes);
    });
  
    document.querySelector('.transform').addEventListener('click', () => {
      vscode.postMessage({type: 'send_changes_for_transforming', value: changes});
    });
  
    // Handle messages sent from the extension to the webview
    window.addEventListener('message', (event) => {
      const message = event.data; // The json data that the extension sent
      switch (
        message.type
      ) {
        case 'get_changes_for_transforming': {
          vscode.postMessage({type: 'send_changes_for_transforming', value: changes});
          break;
        }
        case 'get_changes_for_saving': {
          vscode.postMessage({type: 'send_changes_for_saving', value: changes});
          break;
        }
        case 'import': {
          changes = message.changes;
          updateChangeList(changes);
          break;
        }
      }
    });
  
    /**
     * @param {Array<Change>} changes
     */
    function updateChangeList(changes) {
      const ul = document.querySelector('ul.change-list');
      ul.textContent = '';
      for (let i = 0; i < changes.length; i++) {
        const change = changes[i];
        const li = createHTMLElement({
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
                      type: 'vscode-text-field',
                      className: 'find',
                      placeholder: 'Find',
                      value: change.matcher,
                      onchange: handleChange('matcher', changes, i),
                    },
                    {
                      type: 'vscode-text-field',
                      className: 'replace',
                      placeholder: 'Replace',
                      value: change.resolver,
                      onchange: handleChange('resolver', changes, i),
                    },
                    {
                      type: 'div',
                      className: 'find-options',
                      children: [
                        {
                          type: 'vscode-button',
                          appearance: 'icon',
                          ariaLabel: 'Match case',
                          onclick: handleClick('isCaseSensitive', changes, i),
                          children: [
                            {
                              type: 'span',
                              className: `codicon codicon-case-sensitive${
                                change.isCaseSensitive ? ' set' : ''
                              }`
                            }
                          ]
                        },
                        {
                          type: 'vscode-button',
                          appearance: 'icon',
                          ariaLabel: 'Match whole word',
                          onclick: handleClick('isWholeWords', changes, i),
                          children: [
                            {
                              type: 'span',
                              className: `codicon codicon-whole-word${change.isWholeWords ? ' set' : ''}`,
                            }
                          ]
                        },
                        {
                          type: 'vscode-button',
                          appearance: 'icon',
                          ariaLabel: 'Use regular expression',
                          onclick: handleClick('isUsingRegEx', changes, i),
                          children: [
                            {
                              type: 'span',
                              className: `codicon codicon-regex ${change.isUsingRegEx ? ' set' : ''}`,
                            }
                          ]
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
                      type: 'div',
                      className: `codicon codicon-arrow-up${i === 0 ? ' disabled' : ''}`,
                      ariaLabel: 'Move up',
                      role: 'button',
                      onclick: i > 0 ? reorder(changes, i, i - 1) : () => {},
                    },
                    {
                      type: 'div',
                      className: `codicon codicon-trash`,
                      ariaLabel: 'Delete item',
                      role: 'button',
                      onclick: remove(changes, i),
                    },
                    {
                      type: 'div',
                      className: `codicon codicon-arrow-down${
                        i === changes.length - 1 ? ' disabled' : ''
                      }`,
                      ariaLabel: 'Move down',
                      role: 'button',
                      onclick: i < changes.length - 1 ? reorder(changes, i, i + 1) : () => {},
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
      vscode.setState({changes});
    }
  
    /**
     * @param {string} property
     * @param {Array<Change>} changes
     * @param {number} i
     */
    function handleChange(property, changes, i) {
      /**
       * @param {Event} e;
       */
      return function handler(e) {
        const target = e.currentTarget;
        // updates this property based on the value of the input element
        changes[i][property] = /** @type {HTMLInputElement} */ (target).value;
        updateChangeList(changes);
      };
    }
  
    /**
     * @param {string} property
     * @param {Array<Change>} changes
     * @param {number} i
     */
    function handleClick(property, changes, i) {
      // toggles the value of this property
      return () => {
        changes[i][property] = !changes[i][property];
        updateChangeList(changes);
      };
    }
  
    /**
     * Inverts the position of 2 elements in the array
     * @param {Array<Change>} changes
     * @param {number} pos1
     * @param {number} pos2
     */
    function reorder(changes, pos1, pos2) {
      return () => {
        const change1 = {...changes[pos1]};
        changes[pos1] = {...changes[pos2]};
        changes[pos2] = change1;
        updateChangeList(changes);
      };
    }
  
    /**
     * Removes the selected element from the array
     * @param {Array<Change>} changes
     * @param {number} pos
     */
    function remove(changes, pos) {
      return () => {
        changes.splice(pos, 1);
        updateChangeList(changes);
      };
    }
  
    /**
     * Utility function to create elements from specifications
     * @param {ElementSpec} spec
     */
    function createHTMLElement(spec) {
      const {type, children, ariaLabel, role, ...attributes} = spec;
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
          const childEl = createHTMLElement(child);
          el.append(childEl);
        }
      }
      return el;
    }
  }
}

main();
