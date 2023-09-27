## Setting Models and API Keys

To set the API key used by Codepilot, you can use the `codepilot set --key <your OpenAI key>` command. This command allows you to update the API key in the local configuration.

To switch to using a different model, you can use the `codepilot set --model <OpenAI model name>` command. This command allows you to specify the name of the model you want to use.

Note that only chat completion models are currently supported.

When you switch models, you need to manually rebuild the index by running the `codepilot rebuild` command.
