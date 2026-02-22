/**
 * Pollinations AI Client-Side Service
 * Provides AI code suggestions, chat, and analysis directly from the frontend
 */

const POLLINATIONS_API_BASE = "https://text.pollinations.ai";

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AICodeSuggestion {
  code: string;
  language: string;
  explanation: string;
}

/**
 * Send a message to Pollinations AI and get a response
 */
export async function sendMessage(
  messages: AIMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const {
    model = "openai",
    temperature = 0.7,
    maxTokens = 1000,
  } = options;

  try {
    // Format messages into a prompt
    const prompt = messages
      .map((msg) => {
        if (msg.role === "system") return `System: ${msg.content}`;
        if (msg.role === "user") return `User: ${msg.content}`;
        return `Assistant: ${msg.content}`;
      })
      .join("\n\n");

    const response = await fetch(POLLINATIONS_API_BASE + prompt);

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const text = await response.text();
    return text.trim();
  } catch (error) {
    console.error("Failed to get AI response:", error);
    throw error;
  }
}

/**
 * Get code suggestions for a given context
 */
export async function getCodeSuggestion(
  context: string,
  language: string = "typescript"
): Promise<AICodeSuggestion> {
  const messages: AIMessage[] = [
    {
      role: "system",
      content: `You are a helpful coding assistant. Generate code in ${language} based on the user's request. Provide only the code and a brief explanation.`,
    },
    {
      role: "user",
      content: context,
    },
  ];

  const response = await sendMessage(messages, { temperature: 0.5 });

  // Parse the response to extract code and explanation
  const codeMatch = response.match(/```[\w]*\n([\s\S]*?)```/);
  const code = codeMatch ? codeMatch[1].trim() : response;

  return {
    code,
    language,
    explanation: response.replace(/```[\w]*\n[\s\S]*?```/, "").trim(),
  };
}

/**
 * Generate commit message from changes
 */
export async function generateCommitMessage(diff: string): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: "system",
      content:
        "You are a helpful assistant that generates concise git commit messages. Analyze the diff and create a clear, descriptive commit message following conventional commit format.",
    },
    {
      role: "user",
      content: `Generate a commit message for these changes:\n\n${diff}`,
    },
  ];

  return sendMessage(messages, { temperature: 0.3, maxTokens: 100 });
}

/**
 * Explain code snippet
 */
export async function explainCode(
  code: string,
  language: string = "typescript"
): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: "system",
      content: `You are a helpful coding assistant. Explain what the following ${language} code does in clear, simple terms.`,
    },
    {
      role: "user",
      content: code,
    },
  ];

  return sendMessage(messages, { temperature: 0.5 });
}

/**
 * Generate issue description from title
 */
export async function generateIssueDescription(title: string): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: "system",
      content:
        "You are a helpful assistant that expands issue titles into detailed descriptions. Create a structured issue description with problem statement, expected behavior, and steps to reproduce.",
    },
    {
      role: "user",
      content: `Expand this issue title into a detailed description: "${title}"`,
    },
  ];

  return sendMessage(messages, { temperature: 0.6 });
}

/**
 * Suggest PR title and description from changes
 */
export async function generatePRDescription(
  branch: string,
  diff: string
): Promise<{ title: string; description: string }> {
  const messages: AIMessage[] = [
    {
      role: "system",
      content:
        "You are a helpful assistant that generates PR titles and descriptions. Analyze the changes and create a clear title and detailed description.",
    },
    {
      role: "user",
      content: `Branch: ${branch}\n\nChanges:\n${diff}\n\nGenerate a PR title and description.`,
    },
  ];

  const response = await sendMessage(messages, { temperature: 0.5, maxTokens: 500 });

  // Parse title and description from response
  const lines = response.split("\n");
  const title = lines[0].replace(/^(Title|PR Title):?\s*/i, "").trim();
  const description = lines.slice(1).join("\n").trim();

  return { title, description };
}

/**
 * Review code and suggest improvements
 */
export async function reviewCode(code: string, language: string = "typescript"): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: "system",
      content: `You are a code reviewer. Analyze the ${language} code and suggest improvements for readability, performance, security, and best practices.`,
    },
    {
      role: "user",
      content: code,
    },
  ];

  return sendMessage(messages, { temperature: 0.4 });
}

/**
 * Answer coding questions
 */
export async function askQuestion(question: string): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: "system",
      content:
        "You are a helpful coding assistant. Answer programming questions clearly and provide code examples when helpful.",
    },
    {
      role: "user",
      content: question,
    },
  ];

  return sendMessage(messages);
}
