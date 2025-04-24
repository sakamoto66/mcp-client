export type AiAgentConfig = {
    systemPrompt: string; // システムプロンプト
    llm: {
        provider: 'openai' | 'anthropic' | 'azure' | 'google'; // LLMプロバイダ
        model: string
        api_key?: string,
        temperature?: number
        base_url? : string
    },

    mcpServers: Record<string, {
        command: string; 
        args: string[]; 
        env?: Record<string, string> 
    }>;
};

export type ToolSchema = {
    name: string;
    description?: string;
    inputSchema: any;
}

