import { OpenAIModel, AlphaWave, ChatCompletionFunction, OpenAIModelOptions } from "alphawave";
import { Prompt, ConversationHistory, UserMessage, Message, SystemMessage } from "promptrix";
import { Colorize } from "./internals";
import * as readline from "readline";
import { CodeIndex } from "./CodeIndex";
import { SourceCodeSection } from "./SourceCodeSection";

/**
 * The main class for the Codepilot application.
 */
export class Codepilot {
    private readonly _index: CodeIndex;
    private readonly _functions: Map<string, FunctionEntry> = new Map();

    /**
     * Creates a new `Codepilot` instance.
     * @param index The code index to use.
     */
    public constructor(index: CodeIndex) {
        this._index = index;
    }

    /**
     * Registers a new function to be used in the chat completion.
     * @remarks
     * This is used to add new capabilities to Codepilot's chat feature
     * @param name The name of the function.
     * @param schema The schema of the function.
     * @param fn The function to be executed.
     */
    public addFunction<TArgs = Record<string, any>>(schema: ChatCompletionFunction, fn: (args: TArgs) => Promise<any>): this {
        this._functions.set(schema.name, { schema, fn });
        return this;
    }

    /**
     * Starts the chat session and listens for user input.
     */
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
        const modelOptions: OpenAIModelOptions = {
            apiKey: this._index.keys!.apiKey,
            completion_type: 'chat',
            model: this._index.config!.model,
            temperature: this._index.config!.temperature,
            max_input_tokens: this._index.config!.max_input_tokens,
            max_tokens: this._index.config!.max_tokens,
            //logRequests: true
        };

        if (functions.length > 0) {
            modelOptions.functions = functions;
        }

        return new OpenAIModel(modelOptions);
    }
}

interface FunctionEntry {
    schema: ChatCompletionFunction;
    fn: (args: any) => Promise<any>;
}
