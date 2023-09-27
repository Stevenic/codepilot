"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Codepilot = void 0;
const alphawave_1 = require("alphawave");
const promptrix_1 = require("promptrix");
const internals_1 = require("./internals");
const readline = __importStar(require("readline"));
const SourceCodeSection_1 = require("./SourceCodeSection");
/**
 * The main class for the Codepilot application.
 */
class Codepilot {
    /**
     * Creates a new `Codepilot` instance.
     * @param index The code index to use.
     */
    constructor(index) {
        this._functions = new Map();
        this._index = index;
    }
    /**
     * Gets the code index.
     */
    get index() {
        return this._index;
    }
    /**
     * Registers a new function to be used in the chat completion.
     * @remarks
     * This is used to add new capabilities to Codepilot's chat feature
     * @param name The name of the function.
     * @param schema The schema of the function.
     * @param fn The function to be executed.
     */
    addFunction(schema, fn) {
        this._functions.set(schema.name, { schema, fn });
        return this;
    }
    /**
     * Starts the chat session and listens for user input.
     */
    chat() {
        return __awaiter(this, void 0, void 0, function* () {
            // Create a readline interface object with the standard input and output streams
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            // Create model and wave
            const model = this.createModel();
            const wave = new alphawave_1.AlphaWave({
                model,
                prompt: new promptrix_1.Prompt([
                    new promptrix_1.SystemMessage([
                        `You are an expert software developer.`,
                        `You are chatting with another developer who is asking for help with the project they're working on.`,
                    ].join('\n')),
                    new SourceCodeSection_1.SourceCodeSection(this._index, 0.6),
                    new promptrix_1.ConversationHistory('history', 0.4),
                    new promptrix_1.UserMessage('{{$input}}', 500)
                ])
            });
            // Define main chat loop
            const _that = this;
            function respond(botMessage) {
                return __awaiter(this, void 0, void 0, function* () {
                    function completePrompt(input) {
                        return __awaiter(this, void 0, void 0, function* () {
                            // Route users message to wave
                            const result = yield wave.completePrompt(input);
                            switch (result.status) {
                                case 'success':
                                    const message = result.message;
                                    if (message.function_call) {
                                        // Call function and add result to history
                                        const entry = _that._functions.get(message.function_call.name);
                                        if (entry) {
                                            const args = message.function_call.arguments ? JSON.parse(message.function_call.arguments) : {};
                                            const result = yield entry.fn(args);
                                            wave.addFunctionResultToHistory(message.function_call.name, result);
                                            // Call back in with the function result
                                            yield completePrompt('');
                                        }
                                        else {
                                            respond(internals_1.Colorize.error(`Function '${message.function_call.name}' was not found.`));
                                        }
                                    }
                                    else {
                                        // Call respond to display response and wait for user input
                                        yield respond(internals_1.Colorize.output(message.content));
                                    }
                                    break;
                                default:
                                    if (result.message) {
                                        yield respond(internals_1.Colorize.error(`${result.status}: ${result.message}`));
                                    }
                                    else {
                                        yield respond(internals_1.Colorize.error(`A result status of '${result.status}' was returned.`));
                                    }
                                    break;
                            }
                        });
                    }
                    // Show the bots message
                    console.log(botMessage);
                    // Prompt the user for input
                    rl.question('User: ', (input) => __awaiter(this, void 0, void 0, function* () {
                        // Check if the user wants to exit the chat
                        if (input.toLowerCase() === 'exit') {
                            // Close the readline interface and exit the process
                            rl.close();
                            process.exit();
                        }
                        else {
                            // Complete the prompt using the user's input
                            completePrompt(input);
                        }
                    }));
                });
            }
            // Start chat session
            respond(internals_1.Colorize.output(`Hello, how can I help you?`));
        });
    }
    createModel() {
        // Generate list of functions
        const functions = [];
        for (const entry of this._functions.values()) {
            functions.push(entry.schema);
        }
        // Create an instance of a model
        const modelOptions = {
            apiKey: this._index.keys.apiKey,
            completion_type: 'chat',
            model: this._index.config.model,
            temperature: this._index.config.temperature,
            max_input_tokens: this._index.config.max_input_tokens,
            max_tokens: this._index.config.max_tokens,
            //logRequests: true
        };
        if (functions.length > 0) {
            modelOptions.functions = functions;
        }
        return new alphawave_1.OpenAIModel(modelOptions);
    }
}
exports.Codepilot = Codepilot;
//# sourceMappingURL=Codepilot.js.map