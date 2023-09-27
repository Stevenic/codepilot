/**
 * @private
 * Colorizes text for the console.
 */
export declare class Colorize {
    /**
     * Replaces the current line with the given text.
     * @param text The text to replace the current line with.
     */
    static replaceLine(text: string): string;
    /**
     * Renders the given text as error text.
     * @param error Error text to render.
     */
    static error(error: Error | string): string;
    /**
     * Renders the given text with a highlight to call attention.
     * @param message Text to highlight.
     */
    static highlight(message: string): string;
    /**
     * Renders the given text as general output text.
     * @param output Text to render.
     * @param quote Optional. Quote to use for strings. Defaults to `''`.
     * @param units Optional. Units to use for numbers. Defaults to `''`.
     */
    static output(output: object | string, quote?: string, units?: string): string;
    /**
     * Renders the given text as progress text.
     * @param message Progress text to render.
     */
    static progress(message: string): string;
    /**
     * Renders the given text as a title.
     * @param title Title text to render.
     */
    static title(title: string): string;
    /**
     * Renders the given text as a value.
     * @param field Field name to render.
     * @param value Value to render.
     * @param units Optional. Units to use for numbers. Defaults to `''`.
     */
    static value(field: string, value: any, units?: string): string;
    /**
     * Renders the given text as a warning.
     * @param warning Warning text to render.
     */
    static warning(warning: string): string;
}
//# sourceMappingURL=Colorize.d.ts.map