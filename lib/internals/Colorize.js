"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Colorize = void 0;
const colorizer = require('json-colorizer');
/**
 * @private
 * Colorizes text for the console.
 */
class Colorize {
    /**
     * Replaces the current line with the given text.
     * @param text The text to replace the current line with.
     */
    static replaceLine(text) {
        return '\x1b[A\x1b[2K' + text;
    }
    /**
     * Renders the given text as error text.
     * @param error Error text to render.
     */
    static error(error) {
        if (typeof error === 'string') {
            return `\x1b[31;1m${error}\x1b[0m`;
        }
        else {
            return `\x1b[31;1m${error.message}\x1b[0m`;
        }
    }
    /**
     * Renders the given text as general output text.
     * @param output Text to render.
     * @param quote Optional. Quote to use for strings. Defaults to `''`.
     * @param units Optional. Units to use for numbers. Defaults to `''`.
     */
    static output(output, quote = '', units = '') {
        if (typeof output === 'string') {
            return `\x1b[32m${quote}${output}${quote}\x1b[0m`;
        }
        else if (typeof output === 'object' && output !== null) {
            return colorizer(output, {
                pretty: true,
                colors: {
                    BRACE: 'white',
                    BRACKET: 'white',
                    COLON: 'white',
                    COMMA: 'white',
                    STRING_KEY: 'white',
                    STRING_LITERAL: 'green',
                    NUMBER_LITERAL: 'blue',
                    BOOLEAN_LITERAL: 'blue',
                    NULL_LITERAL: 'blue'
                }
            });
        }
        else if (typeof output == 'number') {
            return `\x1b[34m${output}${units}\x1b[0m`;
        }
        else {
            return `\x1b[34m${output}\x1b[0m`;
        }
    }
    /**
     * Renders the given text as progress text.
     * @param message Progress text to render.
     */
    static progress(message) {
        return `\x1b[90m${message}\x1b[0m`;
    }
    /**
     * Renders the given text as a title.
     * @param title Title text to render.
     */
    static title(title) {
        return `\x1b[35;1m${title}\x1b[0m`;
    }
    /**
     * Renders the given text as a value.
     * @param field Field name to render.
     * @param value Value to render.
     * @param units Optional. Units to use for numbers. Defaults to `''`.
     */
    static value(field, value, units = '') {
        return `${field}: ${Colorize.output(value, '"', units)}`;
    }
    /**
     * Renders the given text as a warning.
     * @param warning Warning text to render.
     */
    static warning(warning) {
        return `\x1b[33m${warning}\x1b[0m`;
    }
}
exports.Colorize = Colorize;
//# sourceMappingURL=Colorize.js.map