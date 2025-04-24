import Anthropic from '@anthropic-ai/sdk';
import { MCPClientManager } from '../mcp-client-manager.js';
import { AiAgentConfig, ToolSchema } from '../types.js';

/**
 * Anthropic LLMを使用して質問を行う
 * @param config 
 * @param mcpManager 
 * @param userQuestion 
 */
export async function promptAnthropic(config: AiAgentConfig, mcpManager:MCPClientManager, userQuestion: string) {
    // ツール取得
    const tools = mcpManager.allTools.map(convert_toolschema);

    const anthropicClient = new Anthropic(
        {
            apiKey: config.llm.api_key,
            baseURL: config.llm.base_url
        }
    );

    const messages: Anthropic.MessageParam[] = [];
    messages.push({
        role: 'user',
        content: userQuestion,
    });

    while(true) {
        // LLMに問い合わせる
        const message = await anthropicClient.messages.create({
            model: config.llm.model,
            max_tokens: 100,
            temperature: config.llm.temperature || 0.0,
            system: config.systemPrompt,
            messages: messages,
            tools,
        });
    
        // 受信したメッセージ履歴に格納
        const { role, content } = message;
        messages.push({ role, content });

        // 受信したメッセージを表示
        message.content.filter(a => a.type === 'text').forEach((a) => console.log(a.text));
        
        // ツールの使用を確認する
        const tool_uses = message.content.filter(a => a.type === 'tool_use');
        // ツール実行
        for(const tool_use of tool_uses) {
            try {
                console.log(`Tool Use: ${tool_use.name}`, tool_use.input);
                const result = await mcpManager.callTool(tool_use.name, tool_use.input);
                console.log(`Tool Result: ${result}`);
                const tool_result = convert_tool_result_to_message(tool_use, result);
                messages.push(tool_result);
            } catch (e) {
                console.log(`Tool Error: ${e}`);
                //ツールの使用を変換できなかった場合はエラーを表示する
                const tool_result = convert_tool_result_to_message(tool_use, `${e}`, true);
                messages.push(tool_result);
            }
        }
        if(message.stop_reason === 'end_turn') {
            break;
        }
    }
}

/**
 * ツールの実行結果をAnthropicの形式に変換する
 * @param tool_use 
 * @param content 
 * @param is_error 
 * @returns 
 */
function convert_tool_result_to_message(tool_use: Anthropic.Messages.ToolUseBlock, content: string, is_error?:boolean): Anthropic.MessageParam {
    return {
        role: 'user',
        content: [{
            type: 'tool_result',
            tool_use_id: tool_use.id,
            content,
            is_error,
        }],
    };
}

/**
 * ToolSchemaをAnthropicの形式に変換する
 * @param tool 
 * @returns 
 */
function convert_toolschema(tool: ToolSchema) {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema,
  };
}
