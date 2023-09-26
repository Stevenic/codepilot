# codepilot
Codepilot is a programming buddy that is an expert on your codebase. You can add Codepilot to any project repo and it will taylor itself to the projects codebase.

## Installation

To install Codepilot, you need a recent version of [Node.js](https://nodejs.org/en) and npm (Node Package Manager) installed on your machine. Then, you can run the following command to install Codepilot globally:

```
npm install -g @stevenic/codepilot
```

## Getting Started

To start a new chat session with Codepilot, simply run the following command from your projects root directory:

```
codepilot
```

Codepilot will guide you through the steps needed to setup a code index for your repo. You'll need an OpenAI key, which you can [get here](https://platform.openai.com/account/api-keys).

## Asking Questions and Making Requests

Once you're in a Codepilot chat session, you can ask questions or make requests related to your code. Codepilot will use its AI models and detailed knowledge of your codebase to provide helpful suggestions and answers.

For example, you can ask it to add new features to your code like:

```
Add a method that does XYZ to the ABC class.
```

Or ask it to document your classes:

```
Write the documentation for the ABC class.
```

Codepilot will generate responses based on the context of your question or request.

## Roadmap

This preview version of Codepilot is a bit limited but I have lots of features planned and coming very very soon:

- Ability to create files. This feature will likely be the next feature added and let Codepilot operate on a par with GPT Engineer.
- Ability to modify existing files. This feature is a little bit tricky given that files can be larger then the context window of most models. This feature will need some bake time but is definitely on the TODO list.
- Ability to create branches, PR's, and merge pull requests.
- LLM-TAGS: Think of these as accessibility tags for Codepilot that help guide it to better results.
  - LLM-REGION - This tag will inform the TextSplitter where to split text at and helps ensure that the model sees whole interfaces, classes, and methods.
  - LLM-RELATED: <query> - This tag will provide Codepilot with a related query that it should run and is useful for pulling base classes and such into the code.
  - LLM-RULE: <rule> - This tag will specify a rule that should be added to Codepilots prompt and lets you give Codepilot guidence for how to better implement new classes or features.
- A new "update" command. Currently you can only rebuild the index in its entirety. The "update" command will let you just update the index for the files that have changed.
- A new "watch" mode that will watch for file changes and update the index for a branch as the files change. This will ensure that your index is always up to date for a given branch.
- A VSCode plugin... How cool would that be.

## Contributing

If you encounter any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request on the Codepilot GitHub repository.

## License

Codepilot is released under the MIT License. See the [LICENSE](LICENSE) file for more details.
