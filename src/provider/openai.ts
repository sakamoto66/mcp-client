import OpenAI from 'openai';
import { MCPClientManager } from '../mcp-client-manager.js';
import { AiAgentConfig, ToolSchema } from '../types.js';

/**
 * OpenAI LLMを使用して質問を行う
 * @param config 
 * @param mcpManager 
 * @param userQuestion 
 */
export async function promptOpenAI(config: AiAgentConfig, mcpManager: MCPClientManager, userQuestion: string) {
    // ツール取得
    const tools = mcpManager.allTools.map(convert_toolschema);

    const openai = new OpenAI({
        apiKey: config.llm.api_key,
        baseURL: config.llm.base_url,
    });
    // OpenAI.Chat.Completions.ChatCompletionMessage
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    messages.push({
        role: 'user',
        content: userQuestion,
    });

    while (true) {
        // LLMに問い合わせる
        const response = await openai.chat.completions.create({
            model: config.llm.model,
            max_tokens: 100,
            temperature: config.llm.temperature || 0.0,
            messages,
            tools
        });

        // 受信したメッセージ履歴に格納
        messages.push(...response.choices.map((a) => a.message));

        // 受信したメッセージを表示
        console.log(response.choices.map((a) => a.message.content).join("\n"))

        // ツールの使用を確認する (OpenAIではツール使用のロジックをカスタムで実装する必要があります)
        const tool_uses = extractToolUses(response);
        for (const tool_use of tool_uses) {
            try {
                const params:any = JSON.parse(tool_use.function.arguments);
                const result = await mcpManager.callTool(tool_use.function.name, params);
                console.log(`Tool Result: ${result}`);
                const tool_result = convert_tool_result_to_message(tool_use, result);
                messages.push(tool_result);
            } catch (e) {
                console.log(`Tool Error: ${e}`);
                const tool_result = convert_tool_result_to_message(tool_use, `Error: ${e}`);
                messages.push(tool_result);
            }
        }

        if (response.choices[0].finish_reason !== 'length') {
            break;
        }
    }
}

/**
 * ツールの実行結果をOpenAIの形式に変換する
 * @param tool_use 
 * @param content 
 * @param is_error 
 * @returns 
 */
function convert_tool_result_to_message(tool_use: OpenAI.Chat.Completions.ChatCompletionMessageToolCall, content: string): OpenAI.Chat.Completions.ChatCompletionMessageParam {
    return {
        role: 'tool',
        tool_call_id: tool_use.id,
        content: content
    }
}

/**
 * ToolSchemaをOpenAIの形式に変換する
 * @param tool 
 * @returns 
 */
function convert_toolschema(tool: ToolSchema):OpenAI.Chat.Completions.ChatCompletionTool {
    return {
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
        },
    }
}

/**
 * メッセージからツール使用を抽出
 * @param content 
 * @param tools 
 * @returns 
 */
function extractToolUses(response: OpenAI.Chat.Completions.ChatCompletion):OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] {
    const tool_uses = response.choices.map(({message}) => message.tool_calls).filter((tool_calls) => tool_calls).flat()
    // @ts-expect-error
    return tool_uses;
}
