import { OpenAIModel, AlphaWave, ChatCompletionFunction } from "alphawave";
import { Prompt, ConversationHistory, UserMessage, Message, SystemMessage } from "promptrix";
import { Colorize } from "./internals";
import * as readline from "readline";
import { CodeIndex } from "./CodeIndex";
import { SourceCodeSection } from "./SourceCodeSection";

export interface CodepilotConfig {
    apiKey: string;
    model: string;
    max_input_tokens: number;
    max_tokens: number;
    temperature: number;
    folderPath?: string;
}

export class Codepilot {
    private readonly _config: CodepilotConfig;
    private readonly _functions: Map<string, FunctionEntry> = new Map();
    private readonly _index: CodeIndex;

    public constructor(config: CodepilotConfig) {
        this._config = config;
        this._index = new CodeIndex(config.folderPath);
    }

    public addFunction<TArgs = Record<string, any>>(schema: ChatCompletionFunction, fn: (args: TArgs) => Promise<any>): this {
        this._functions.set(schema.name, { schema, fn });
        return this;
    }

    public async chat(): Promise<void> {
        // Create a readline interface object with the standard input and output streams
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Create model and wave
        const model = this.createModel();
        const wave = new AlphaWave({
            model,
            prompt: new Prompt([
                new SystemMessage([
                    `You are an expert software developer.`,
                    `You are chatting with another developer who is asking for help with the project they're working on.`,
                ].join('\n')),
                new SourceCodeSection(this._index, 0.6),
                new ConversationHistory('history', 0.4),
                new UserMessage('{{$input}}', 500)
            ])
        });

        // Define main chat loop
        const _that = this;
        async function respond(botMessage: string) {
            async function completePrompt(input: string) {
                // Route users message to wave
                const result = await wave.completePrompt<string>(input);
                switch (result.status) {
                    case 'success':
                        const message = result.message as Message<string>;
                        if (message.function_call) {
                            // Call function and add result to history
                            const entry = _that._functions.get(message.function_call.name!)!;
                            if (entry) {
                                const args = message.function_call.arguments ? JSON.parse(message.function_call.arguments) : {};
                                const result = await entry.fn(args);
                                wave.addFunctionResultToHistory(message.function_call.name!, result);

                                // Call back in with the function result
                                await completePrompt('');
                            } else {
                                respond(Colorize.error(`Function '${message.function_call.name}' was not found.`));
                            }
                        } else {
                            // Call respond to display response and wait for user input
                            await respond(Colorize.output(message.content!));
                        }
                        break;
                    default:
                        if (result.message) {
                            await respond(Colorize.error(`${result.status}: ${result.message}`));
                        } else {
                            await respond(Colorize.error(`A result status of '${result.status}' was returned.`));
                        }
                        break;
                }
            }

            // Show the bots message
            console.log(botMessage);

            // Prompt the user for input
            rl.question('User: ', async (input: string) => {
                // Check if the user wants to exit the chat
                if (input.toLowerCase() === 'exit') {
                    // Close the readline interface and exit the process
                    rl.close();
                    process.exit();
                } else {
                    // Complete the prompt using the user's input
                    completePrompt(input);
                }
            });
        }

        // Start chat session
        respond(Colorize.output(`Hello, how can I help you?`));
    }

    private createModel(): OpenAIModel {
        // Generate list of functions
        const functions: ChatCompletionFunction[] = [];
        for (const entry of this._functions.values()) {
            functions.push(entry.schema);
        }

        // Create an instance of a model
        return new OpenAIModel({
            apiKey: this._config.apiKey,
            completion_type: 'chat',
            model: this._config.model,
            temperature: this._config.temperature,
            max_input_tokens: this._config.max_input_tokens,
            max_tokens: this._config.max_tokens,
            functions
        });
    }
}

interface FunctionEntry {
    schema: ChatCompletionFunction;
    fn: (args: any) => Promise<any>;
}
