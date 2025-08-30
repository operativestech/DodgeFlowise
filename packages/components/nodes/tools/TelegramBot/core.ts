import axios from 'axios'
import { Tool } from '@langchain/core/tools'

/**
 * Represents the input parameters required for interacting with a Telegram bot.
 *
 * @interface TelegramBotToolInputs
 *
 * @property {string} botToken - The token used for authenticating and identifying the Telegram bot.
 * @property {string} chatId - The unique identifier for the chat where messages will be sent or received.
 */
export interface TelegramBotToolInputs {
    botToken: string
}

/**
 * TelegramBotTool is a class designed to send messages to Telegram chats.
 * It interacts with the Telegram Bot API for message delivery.
 */
export class TelegramBotTool extends Tool {
    name = 'telegram'
    description = `Send messages to Telegram chats.
    Input should be a json string with two keys: "message" and "chatId".
    The value of "message" should be a string, and the value of "chatId" will be an integer.
    Be careful to always use double quotes for strings in the json string,
    The output will be either "Message sent successfully to Telegram!" in case of success, or
    an error string indicating what the error was in case of a failure.`
    returnDirect = false
    botToken: string

    // chatId: string

    constructor(toolInput: TelegramBotToolInputs) {
        super()
        this.botToken = toolInput.botToken
        // this.chatId = toolInput.chatId
    }

    async _call(input: string): Promise<string> {
        try {
            let { message, chatId } = JSON.parse(input) as { chatId: number; message: string }

            console.log('input string:', input)

            console.log('Extracted chatId:', chatId)
            console.log('Extracted message:', message)

            // Validate chatId and message
            if (!chatId) {
                throw new Error('Chat ID is not provided dynamically! Please ask the user to provide a chat ID!')
            }
            if (!message) {
                throw new Error('Message is not provided dynamically! Please ask the user to provide a message!')
            }

            if (!this.botToken) {
                throw new Error('Bot Token not provided!')
            }

            // Construct Telegram API call
            const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`
            const body = { chat_id: chatId, text: message }
            console.log('Telegram API call:', { url, body })
            console.log('Attempting to send Telegram message...', { chatId, message })

            const axiosResponse = await axios.post(url, body, {
                headers: { 'Content-Type': 'application/json' }
            })

            if (axiosResponse.data && axiosResponse.data.ok) {
                console.log('Message sent successfully!')
                return 'Message sent successfully to Telegram!'
            } else {
                console.error('Telegram API response:', axiosResponse.data)
                throw new Error(`Telegram API error: ${JSON.stringify(axiosResponse.data)}`)
            }
        } catch (error) {
            console.error('Error sending Telegram message:', error)
            // throw new Error(`Failed to send Telegram message: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return `${error}`
        }
    }
}
