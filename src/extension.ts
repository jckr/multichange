import * as vscode from 'vscode';
import { MultichangeViewProvider } from './providers/multichangeProvider';

export function activate(context: vscode.ExtensionContext) {

	const provider = new MultichangeViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(MultichangeViewProvider.viewType, provider));

	context.subscriptions.push(
	 	vscode.commands.registerCommand('multichange.import', () => {
	 		provider.import();
	 	}));
	
	context.subscriptions.push(
		vscode.commands.registerCommand('multichange.save', () => {
			provider.save();
		}));

	context.subscriptions.push(
	 	vscode.commands.registerCommand('multichange.transform', () => {
	 		provider.transform();
	 	}));
}

