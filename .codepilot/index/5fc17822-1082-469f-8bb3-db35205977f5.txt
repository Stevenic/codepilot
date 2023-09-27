# Codepilot Usage

Welcome to the usage guide for Codepilot! Codepilot is a powerful programming tool that serves as your expert companion in navigating and understanding your codebase. With Codepilot, you can harness the power of AI to get instant answers, suggestions, and insights related to your code.

Whether you're a beginner looking for guidance or an experienced developer seeking to optimize your workflow, Codepilot is here to assist you. From providing code snippets and examples to helping you troubleshoot issues and explore different parts of your codebase, Codepilot is your go-to resource for code-related queries.

In this guide, we'll walk you through the installation process, getting started with Codepilot, utilizing its features, customizing its behavior, and contributing to its development. Let's dive in and unlock the full potential of Codepilot!

## Installation

To install Codepilot, you need a recent version of [Node.js](https://nodejs.org/en) and npm (Node Package Manager) installed on your machine. Then, you can run the following command to install Codepilot globally:

```bash
npm install -g @stevenic/codepilot
```

## Getting Started

To get started with Codepilot, follow these steps:

1. Install Codepilot globally on your machine by running the following command:

   ```bash
   npm install -g @stevenic/codepilot
   ```

2. Navigate to your project's root directory in the terminal.

3. Run the following command to start a new chat session with Codepilot:

   ```bash
   codepilot
   ```

4. Codepilot will guide you through the steps needed to set up a code index for your repository. You'll need an OpenAI API key to proceed. If you don't have an API key, you can [get one here](https://platform.openai.com/account/api-keys).

5. Once you have your API key, enter it when prompted by Codepilot.

6. Codepilot will then start indexing your codebase and generating embeddings for your code.

7. Once the indexing process is complete, you can start asking questions or making requests related to your code. Codepilot will use its AI models and knowledge of your codebase to provide helpful suggestions and answers.

   For example, you can ask Codepilot to add new features to your code or generate documentation for your classes.

8. Codepilot will generate responses based on the context of your question or request.

That's it! You're now ready to use Codepilot to navigate and understand your codebase.

## Adding and Removing Sources

To add a new folder or file to your code index, you can use the `codepilot add` command. This command allows you to specify one or more source paths that you want to add to your index. Here's an example of how to use the `codepilot add` command:

```bash
codepilot add --source <folder or file path>
```

Replace `<folder or file path>` with the path to the folder or file that you want to add. You can also pass multiple `--source` options to add multiple folders or files at once.

Similarly, to remove a folder or file from your code index, you can use the `codepilot remove` command. This command also accepts one or more source paths that you want to remove from your index. Here's an example of how to use the `codepilot remove` command:

```bash
codepilot remove --source <folder or file path>
```

Replace `<folder or file path>` with the path to the folder or file that you want to remove. You can pass multiple `--source` options to remove multiple folders or files at once.

Note: When you add or remove a source from your index, you currently need to manually rebuild it by running `codepilot rebuild`. Codepilot has already given me grief for not having a watch feature, and it even offered up the code, so coming soon :)

## Adding and Removing Extension Filters

To add or remove extension filters in the code index, you can use the `codepilot addExtensionFilter` and `codepilot removeExtensionFilter` commands respectively. These commands allow you to specify the file extensions that you want to include or exclude from the code index.

To add an extension filter, use the following command:

```bash
codepilot add --extension <file extension to include>
```

Replace `<file extension to include>` with the file extension that you want to include in the code index. For example, to include JavaScript files, you would use `--extension .js`.

By default, all file extensions are indexed. However, once you start adding extension filters, only files with those extensions will be indexed.

To remove an extension filter, use the following command:

```bash
codepilot remove --extension <file extension to remove>
```

Replace `<file extension to remove>` with the file extension that you want to remove from the code index. For example, to remove TypeScript files, you would use `--extension .ts`.

Note: When you add or remove a extension filters from your index, you currently need to manually rebuild it by running `codepilot rebuild`.

## Setting Models and API Keys

LLM-TODO: write the documentation for this. You can use `codepilot set --key <your OpenAI key>` to update the API key used by Codepilot and `codepilot set --model <OpenAI model name>` to switch to using a different model. Only chat completion models are currently supported.

Note: When you switch models, you currently need to manually rebuild it by running `codepilot rebuild`.
