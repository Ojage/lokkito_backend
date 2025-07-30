import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenaiService {
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly logger = new Logger(OpenaiService.name);

  constructor(private readonly configService: ConfigService) {
    // Get configuration values using ConfigService
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const modelId = this.configService.get<string>('OPENAI_MODEL_ID');

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.model = modelId;
    this.openai = new OpenAI({
      apiKey: apiKey,
    });

    this.logger.log(`OpenAI service initialized with model: ${this.model}`);
  }

  async sendToCustomModel(prompt: string): Promise<{ response: string }> {
    try {
      if (!prompt?.trim()) {
        throw new Error('Prompt cannot be empty');
      }

      this.logger.debug(`Sending prompt to model ${this.model}`);

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000, // Adjust as needed
        temperature: 0.7, // Adjust for creativity vs consistency
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response content received from OpenAI');
      }

      return {
        response: content,
      };
    } catch (error) {
      this.logger.error(
        `Error calling OpenAI API: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to get response from OpenAI: ${error.message}`);
    }
  }

  // Additional method for more complex conversations
  async sendMessages(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  ): Promise<{ response: string }> {
    try {
      if (!messages?.length) {
        throw new Error('Messages array cannot be empty');
      }

      this.logger.debug(
        `Sending ${messages.length} messages to model ${this.model}`,
      );

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response content received from OpenAI');
      }

      return {
        response: content,
      };
    } catch (error) {
      this.logger.error(
        `Error calling OpenAI API: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to get response from OpenAI: ${error.message}`);
    }
  }

  // Method for streaming responses (useful for long responses)
  async streamResponse(prompt: string): Promise<AsyncIterable<string>> {
    try {
      if (!prompt?.trim()) {
        throw new Error('Prompt cannot be empty');
      }

      this.logger.debug(`Streaming response from model ${this.model}`);

      const stream = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: true,
        max_tokens: 1000,
        temperature: 0.7,
      });

      return this.processStream(stream);
    } catch (error) {
      this.logger.error(
        `Error streaming from OpenAI API: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Failed to stream response from OpenAI: ${error.message}`,
      );
    }
  }

  private async *processStream(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
  ): AsyncIterable<string> {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}
