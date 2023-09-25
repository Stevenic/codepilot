"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Colorize = void 0;
const colorizer = require('json-colorizer');
/**
 * @private
 */
class Colorize {
    static replaceLine(text) {
        return '\x1b[A\x1b[2K' + text;
    }
    static error(error) {
        if (typeof error === 'string') {
            return `\x1b[31;1m${error}\x1b[0m`;
        }
        else {
            return `\x1b[31;1m${error.message}\x1b[0m`;
        }
    }
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
    static progress(message) {
        return `\x1b[90m${message}\x1b[0m`;
    }
    static success(message) {
        return `\x1b[32;1m${message}\x1b[0m`;
    }
    static title(title) {
        return `\x1b[35;1m${title}\x1b[0m`;
    }
    static value(field, value, units = '') {
        return `${field}: ${Colorize.output(value, '"', units)}`;
    }
    static warning(warning) {
        return `\x1b[33m${warning}\x1b[0m`;
    }
}
exports.Colorize = Colorize;
//# sourceMappingURL=Colorize.js.map