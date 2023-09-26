import { ChatCompletionFunction } from "alphawave";
import { Codepilot } from "../Codepilot";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * Schema for a function that creates a file at the specified path.
 */
const createFileFunction: ChatCompletionFunction = {
    name: "createFile",
    description: "Creates a new file at the specified path. Only use for new files not existing ones.",
    parameters: {
        type: "object",
        properties: {
            filePath: {
                type: "string",
                description: "The path to the file to create"
            },
            contents: {
                type: "string",
                description: "The contents to write to the new file"
            }
        },
        required: ["filePath", "contents"]
    }
};

/**
 * Adds the createFile function to the codepilot instance.
 */
export function addCreateFile(codepilot: Codepilot): void {
    codepilot.addFunction(createFileFunction, async (args: any) => {
        const { filePath, contents } = args;

        // Check if the file already exists
        if (await fs.access(path.join(process.cwd(), filePath)).then(() => true).catch(() => false)) {
            return `File already exists at ${filePath}`;
        }

        try {
            // Write the code to the file
            await fs.writeFile(path.join(process.cwd(), filePath), contents);
            return `Successfully created file at ${filePath}`;
        } catch (error) {
            return `Failed to create file at ${filePath}`;
        }
    });
}
