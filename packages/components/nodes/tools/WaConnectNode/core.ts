import axios from 'axios'
import { Tool } from '@langchain/core/tools'

export interface WhatsappTextToolInputs {
    apiToken: string
    instance_id: string
}

/**
 * WhatsappTextTool is a class designed to send text messages to WhatsApp chats.
 * It interacts with the WaConnect API for message delivery.
 */
export class WhatsappTextTool extends Tool {
    name = 'whatsappTextTool'
    description = `Send text messages to Whatsapp chats.
    apiToken and instance_id are inputs to the node, and you don't ask the user to input them in the chat.
    User inputs can be in JSON format or natural language.
    A natural language string in the format:
       send message to chat Number : phone_number with text message_content.
       "chat_id" (string) refers to the phone number of the recipient.
       "text" (string) is the message content to send via WhatsApp.
    The output will be either "Message sent successfully to Whatsapp!" in case of success, or
    an error string indicating what the error was in case of a failure.`
    returnDirect = false
    apiToken: string
    instance_id: string

    constructor(toolInput: WhatsappTextToolInputs) {
        super()
        this.apiToken = toolInput.apiToken
        this.instance_id = toolInput.instance_id
    }

    async _call(input: string): Promise<string> {
        try {
            let chat_id = '',
                text = ''

            // Check if input is JSON or natural language
            try {
                // Attempt to parse as JSON
                const parsedInput = JSON.parse(input)
                if (typeof parsedInput === 'object' && parsedInput.chat_id && parsedInput.text) {
                    // Check if chat_id starts with 0, add prefix '2' if it does
                    chat_id = parsedInput.chat_id.toString().startsWith('0') ? '2' + parsedInput.chat_id : parsedInput.chat_id
                    text = parsedInput.text
                } else {
                    throw new Error('Invalid JSON format')
                }
            } catch {
                // If it's not JSON, assume natural language format
                const chatIdMatch = input.match(/chat Number\s*:\s*(\d+)/i)
                const textMatch = input.match(/with text\s*(.+?)(?:\.|$)/i) || input.match(/text\s*:\s*(.+?)(?:\.|$)/i)

                if (chatIdMatch && textMatch) {
                    let extractedChatId = chatIdMatch[1]

                    // Check if chat_id starts with 0, add prefix '2' if it does
                    chat_id = extractedChatId.startsWith('0') ? '2' + extractedChatId : extractedChatId
                    text = textMatch[1].trim()
                } else {
                    throw new Error(
                        `Input didn't match expected formats. Input should either be JSON structured like {"chat_id": "number", "text": "message content"} or in natural language like "send message to chat Number: 12345 with text Hello there." `
                    )
                }
            }

            // Validate required fields
            if (!chat_id) {
                throw new Error('Chat ID was not provided in the input!')
            }
            if (!text) {
                throw new Error('Message text was not provided in the input!')
            }
            if (!this.apiToken) {
                throw new Error('API Token is required but not provided!')
            }

            // Check message length limit (4096 characters)
            if (text.length > 4096) {
                throw new Error(`Message exceeds the maximum length of 4096 characters. Current length: ${text.length} characters.`)
            }

            const url = `https://waconnect.aimicromind.com/api/v1/${this.instance_id}/send-message`
            const body = { token: this.apiToken, chat_id, text }

            console.log('Attempting to send WhatsApp message...', { chat_id, textLength: text.length })

            // Execute the API call
            const axiosResponse = await axios.post(url, body, {
                headers: { 'Content-Type': 'application/json' }
            })

            if (axiosResponse.data && axiosResponse.data.success === true) {
                console.log('Message sent successfully!')
                return `Message sent successfully to this number '${chat_id}'!`
            } else {
                console.error('WhatsApp API response:', axiosResponse.data)
                throw new Error(`WhatsApp API error: ${JSON.stringify(axiosResponse.data)}`)
            }
        } catch (error) {
            console.error('Error in WhatsappTextTool:', error.message)
            return `${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
}
