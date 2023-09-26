import { ChatCompletionFunction } from "alphawave";
import { CodeIndex } from "./CodeIndex";
/**
 * The main class for the Codepilot application.
 */
export declare class Codepilot {
    private readonly _index;
    private readonly _functions;
    /**
     * Creates a new `Codepilot` instance.
     * @param index The code index to use.
     */
    constructor(index: CodeIndex);
    /**
     * Registers a new function to be used in the chat completion.
     * @remarks
     * This is used to add new capabilities to Codepilot's chat feature
     * @param name The name of the function.
     * @param schema The schema of the function.
     * @param fn The function to be executed.
     */
    addFunction<TArgs = Record<string, any>>(schema: ChatCompletionFunction, fn: (args: TArgs) => Promise<any>): this;
    /**
     * Starts the chat session and listens for user input.
     */
    chat(): Promise<void>;
    private createModel;
}
//# sourceMappingURL=Codepilot.d.ts.map