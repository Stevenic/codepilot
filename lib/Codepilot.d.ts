import { ChatCompletionFunction } from "alphawave";
import { CodeIndex } from "./CodeIndex";
export declare class Codepilot {
    private readonly _index;
    private readonly _functions;
    constructor(index: CodeIndex);
    addFunction<TArgs = Record<string, any>>(schema: ChatCompletionFunction, fn: (args: TArgs) => Promise<any>): this;
    chat(): Promise<void>;
    private createModel;
}
//# sourceMappingURL=Codepilot.d.ts.map