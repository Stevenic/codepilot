"use strict";
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
exports.SourceCodeSection = void 0;
const promptrix_1 = require("promptrix");
class SourceCodeSection extends promptrix_1.PromptSectionBase {
    /**
     * Creates a new 'SourceCodeSection' instance.
     * @param index Code index to use.
     * @param tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param userPrefix Optional. Prefix to use for text output. Defaults to `user: `.
     */
    constructor(index, tokens = -1, userPrefix = 'user: ') {
        super(tokens, true, '\n', userPrefix);
        this._index = index;
    }
    renderAsMessages(memory, functions, tokenizer, maxTokens) {
        return __awaiter(this, void 0, void 0, function* () {
            // Query the code index
            const query = memory.get('input');
            const results = yield this._index.query(query, {
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
                const sections = yield result.renderSections(Math.min(remaining, options.tokens), options.sections);
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
        });
    }
    getSectionOptions(maxTokens) {
        if (maxTokens < 2000) {
            return { sections: 1, tokens: maxTokens };
        }
        else if (maxTokens <= 6000) {
            return { sections: 1, tokens: 2000 };
        }
        else {
            return { sections: 2, tokens: 2000 };
        }
    }
}
exports.SourceCodeSection = SourceCodeSection;
//# sourceMappingURL=SourceCodeSection.js.map