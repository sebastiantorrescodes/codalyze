// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "codalyze" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable2= vscode.commands.registerCommand('codalyze.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from codalyze!');
	});

	let disposable = vscode.commands.registerCommand('codalyze.processWithCodalyze', async () => {
		try {
			const editor = vscode.window.activeTextEditor;
			if(!editor){
				vscode.window.showErrorMessage("No active editor found");
				return;
			}

			const selection = editor.selection;
			const selectedText = editor.document.getText(selection);

			if (! selectedText){
				vscode.window.showErrorMessage("No text selected");
				return;
			}

			const userQuestion = await vscode.window.showInputBox({
				placeHolder: "What do you want to ask Codalyze?",
				prompt : "Ask Codalyze a question about the selected code"
			});

			if (!userQuestion){
				return;
			}

			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Codalyze is processing your request",
				cancellable: false
			}, async () => {
				const response = await callAIModel(selectedText, userQuestion);

				const document = await vscode.workspace.openTextDocument({
					content: response,
					language: 'markdown'
				});
				await vscode.window.showTextDocument(document);
			});

		} catch (error){
			vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
		}
	}); 

	

	

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
}

async function callAIModel(selectedText: string, userQuestion: string): Promise<string>{

	try {
		const apiKey = process.env.API_KEY;

		if (!apiKey) {
			throw new Error('API key not found. Please set it in your .env file.');
		}

		const response = await axios.post(
			'https://openrouter.ai/api/v1/chat/completions',
			{
				model: 'meta-llama/llama-4-scout:free',
				messages: [
					{
						role: 'system',
						content: `You are a code analysis tool. Answer the question based on the selected code. 
						Selected code: ${selectedText}. 
						Question: ${userQuestion}`
					}
				],
				temperature: 0.7,
				headers: {
					"HTTP-Referer": "https://github.com/sebastiantorrescodes/codalyze", 
					"X-Title": "AI Text Processor for VS Code" 
				}
			},

			{
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json'
				}
			}

		); 
		return response.data.choices[0].message.content;

	} catch (error) {
		if (axios.isAxiosError(error) && error.response) {
			throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
		}
		throw error;
	}
}



// This method is called when your extension is deactivated
export function deactivate() {}
