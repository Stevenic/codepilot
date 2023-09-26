import { Message, PromptFunctions, PromptMemory, PromptSectionBase, RenderedPromptSection, Tokenizer, UserMessage } from "promptrix";
import { CodeIndex } from "./CodeIndex";

/**
 * A section that renders source code snippets from the code index.
 */
export class SourceCodeSection extends PromptSectionBase {
    private readonly _index: CodeIndex;

    /**
     * Creates a new 'SourceCodeSection' instance.
     * @param index Code index to use.
     * @param tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param userPrefix Optional. Prefix to use for text output. Defaults to `user: `.
     */
    public constructor(index: CodeIndex, tokens: number = -1, userPrefix: string = 'user: ') {
        super(tokens, true, '\n', userPrefix);
        this._index = index;
    }

    public async renderAsMessages(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message<string>[]>> {
        // Query the code index
        const query = memory.get('input') as string;
        const results = await this._index.query(query, {
            maxDocuments: 100,
            maxChunks: 2000
        });

        // Render code & text snippets
        let text = `Here are some snippets of code and text that might help:`;
        let tokens = tokenizer.encode(text).length;
        let remaining = maxTokens - tokens;
        for (const result of results) {
            // Create title
            const title = `\n\npath: ${result.uri}\nsnippet:\n`;
            const titleLength = tokenizer.encode(title).length;
            if (remaining - titleLength < 0) {
                break;
            }

            // Render sections
            const options = this.getSectionOptions(remaining - titleLength);
            const sections = await result.renderSections(Math.min(remaining, options.tokens), options.sections);

            // Add snippets to text
            for (const section of sections) {
                const length = section.tokenCount + titleLength;
                if (remaining - length < 0) {
                    break;
                }

                text += title + section.text;
                remaining -= length;
            }
        }

        // Return as a user message
        return {
            output: [{ role: 'user', content: text }],
            length: maxTokens - remaining,
            tooLong: remaining < 0
        };
    }

    private getSectionOptions(maxTokens: number): { sections: number; tokens: number; } {
        if (maxTokens < 2000) {
            return { sections: 1, tokens: maxTokens };
        } else if (maxTokens <= 6000) {
            return { sections: 1, tokens: 2000 };
        } else {
            return { sections: 2, tokens: 2000 };
        }
    }
}