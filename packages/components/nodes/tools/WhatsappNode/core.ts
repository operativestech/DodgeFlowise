import axios from 'axios'
import { Tool } from '@langchain/core/tools'

export interface WhatsappBotToolInputs {
    apiToken: string
    instance_id: string
}

/**
 * TelegramBotTool is a class designed to send messages to Telegram chats.
 * It interacts with the Telegram Bot API for message delivery.
 */
export class WhatsappBotTool extends Tool {
    name = 'whatsappTool'
    description = `Send messages to Whatsapp chats.
    apiToken and instance_id are inputs to the node, and you don't ask the user to input them in the chat.
    User inputs can be in JSON format or natural language.
    A natural language string in the format:
       here is the chat Number : phone_number and the message will be message_text.
       "chat_id" (string) chatID = chat_id = phone Number = chat number all of them refers to the phone number of the chat and you will parse it to string.
       "text" (string) message_text = message = message text refers to the message that will be sent to the chat.
    The output will be either "Message sent successfully to Whatsapp!" in case of success, or
    an error string indicating what the error was in case of a failure.`
    returnDirect = false
    apiToken: string
    instance_id: string

    // chatId: string

    constructor(toolInput: WhatsappBotToolInputs) {
        super()
        this.apiToken = toolInput.apiToken
        this.instance_id = toolInput.instance_id
    }

    async _call(input: string): Promise<string> {
        try {
            let text = '',
                chat_id = ''

            // Check if input is JSON or natural language
            try {
                // Attempt to parse as JSON
                const parsedInput = JSON.parse(input)
                if (typeof parsedInput === 'object' && parsedInput.text && parsedInput.chat_id) {
                    text = parsedInput.text
                    chat_id = parsedInput.chat_id
                } else {
                    throw new Error('Invalid JSON format')
                }
            } catch {
                // If it's not JSON, assume natural language format
                // Extract `chat_id` and `text` using regular expressions or text parsing
                const chatIdMatch = input.match(/chat Number\s*:\s*(\d+)/i) // Extract number after "chat Number"
                const messageMatch = input.match(/message will be\s*(.+)$/i) // Extract text after "message will be"
                if (chatIdMatch && messageMatch) {
                    chat_id = chatIdMatch[1]
                    text = messageMatch[1]
                } else {
                    throw new Error(
                        `Input didn't match expected formats. Input should either be JSON structured like {"text": "message", "chat_id": "number"} or in natural language like "here is the chat Number: 12345 and the message will be ..." `
                    )
                }
            }

            console.log('Extracted chatId:', chat_id)
            console.log('Extracted message:', text)

            // Validate chatId and text
            if (!chat_id) {
                throw new Error('Chat ID was not provided in the input!')
            }
            if (!text) {
                throw new Error('Message was not provided in the input!')
            }

            if (!this.apiToken) {
                throw new Error('API Token is required but not provided!')
            }

            const url = `https://wapilot.net/api/v1/${this.instance_id}/send-message`
            const body = { token: this.apiToken, chat_id, text }
            console.log('Whatsapp API call:', { url, body })
            console.log('Attempting to send Whatsapp message...', { chat_id, text })

            // Execute the API call
            const axiosResponse = await axios.post(url, body, {
                headers: { 'Content-Type': 'application/json' }
            })

            if (axiosResponse.data && axiosResponse.data.ok) {
                console.log('Message sent successfully!')
                return `Message sent successfully to this number '${chat_id}'!`
            } else {
                console.error('Whatsapp API response:', axiosResponse.data)
                throw new Error(`Whatsapp API error: ${JSON.stringify(axiosResponse.data)}`)
            }
        } catch (error) {
            console.error('Error in WhatsappBotTool:', error.message)
            return `${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
}
