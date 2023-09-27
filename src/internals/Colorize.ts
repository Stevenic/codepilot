const colorizer = require('json-colorizer');

/**
 * @private
 * Colorizes text for the console.
 */
export class Colorize {
    /**
     * Replaces the current line with the given text.
     * @param text The text to replace the current line with.
     */
    public static replaceLine(text: string): string {
        return '\x1b[A\x1b[2K' + text;
    }

    /**
     * Renders the given text as error text.
     * @param error Error text to render.
     */
    public static error(error: Error|string): string {
        if (typeof error === 'string') {
            return `\x1b[31;1m${error}\x1b[0m`;
        } else {
            return `\x1b[31;1m${error.message}\x1b[0m`;
        }
    }

    /**
     * Renders the given text with a highlight to call attention.
     * @param message Text to highlight.
     */
    public static highlight(message: string): string {
        return `\x1b[34;1m${message}\x1b[0m`;
    }

    /**
     * Renders the given text as general output text.
     * @param output Text to render.
     * @param quote Optional. Quote to use for strings. Defaults to `''`.
     * @param units Optional. Units to use for numbers. Defaults to `''`.
     */
    public static output(output: object | string, quote: string = '', units: string = ''): string {
        if (typeof output === 'string') {
            return `\x1b[32m${quote}${output}${quote}\x1b[0m`;
        } else if (typeof output === 'object' && output !== null) {
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
        } else if (typeof output == 'number') {
            return `\x1b[34m${output}${units}\x1b[0m`;
        } else {
            return `\x1b[34m${output}\x1b[0m`;
        }
    }

    /**
     * Renders the given text as progress text.
     * @param message Progress text to render.
     */
    public static progress(message: string): string {
        return `\x1b[90m${message}\x1b[0m`;
    }

    /**
     * Renders the given text as a title.
     * @param title Title text to render.
     */
    public static title(title: string): string {
        return `\x1b[35;1m${title}\x1b[0m`;
    }

    /**
     * Renders the given text as a value.
     * @param field Field name to render.
     * @param value Value to render.
     * @param units Optional. Units to use for numbers. Defaults to `''`.
     */
    public static value(field: string, value: any, units: string = ''): string {
        return `${field}: ${Colorize.output(value, '"', units)}`;
    }

    /**
     * Renders the given text as a warning.
     * @param warning Warning text to render.
     */
    public static warning(warning: string): string {
        return `\x1b[33m${warning}\x1b[0m`;

    }
}