import { Message, PromptFunctions, PromptMemory, PromptSectionBase, RenderedPromptSection, Tokenizer } from "promptrix";
import { CodeIndex } from "./CodeIndex";
/**
 * A section that renders source code snippets from the code index.
 */
export declare class SourceCodeSection extends PromptSectionBase {
    private readonly _index;
    /**
     * Creates a new 'SourceCodeSection' instance.
     * @param index Code index to use.
     * @param tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param userPrefix Optional. Prefix to use for text output. Defaults to `user: `.
     */
    constructor(index: CodeIndex, tokens?: number, userPrefix?: string);
    renderAsMessages(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message<string>[]>>;
    private getSectionOptions;
}
//# sourceMappingURL=SourceCodeSection.d.ts.map