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
            return `A file already exists at that path.\nGive the user detailed instructions for how they should modify that file instead.`;
        }

        try {
            // Create the directory path if it doesn't exist
            const directoryPath = path.dirname(filePath);
            await fs.mkdir(directoryPath, { recursive: true });

            // Write the code to the file
            await fs.writeFile(path.join(process.cwd(), filePath), contents);

            // Add the file to the code index
            await codepilot.index.upsertDocument(filePath);
            return `Successfully created file at ${filePath}`;
        } catch (error) {
            return `Failed to create file at ${filePath} due to the following error:\n${(error as Error).message}`;
        }
    });
}
