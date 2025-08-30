import axios from 'axios'
import { Tool } from '@langchain/core/tools'
import * as fs from 'fs'
import FormData from 'form-data'
import path from 'path'

export interface WhatsappImageToolInputs {
    apiToken: string
    instance_id: string
}

/**
 * WhatsappImageTool is a class designed to send images to WhatsApp chats.
 * It interacts with the WaConnect API for image delivery.
 */
export class WhatsappImageTool extends Tool {
    name = 'whatsappImageTool'
    description = `Send images to Whatsapp chats.
    apiToken and instance_id are inputs to the node, and you don't ask the user to input them in the chat.
    User inputs can be in JSON format or natural language.
    A natural language string in the format:
       here is the chat Number : phone_number and the image path is image_path with caption caption_text. 
       "chat_id" (string) refers to the phone number of the recipient. if you received the number start with zero, add prefix '2' automatically.
       "image_path" (string) is the local path to the image file or a URL.
       "caption" (string) is an optional text caption for the image.
    The output will be either "Image sent successfully to Whatsapp!" in case of success, or
    an error string indicating what the error was in case of a failure.`
    returnDirect = false
    apiToken: string
    instance_id: string

    constructor(toolInput: WhatsappImageToolInputs) {
        super()
        this.apiToken = toolInput.apiToken
        this.instance_id = toolInput.instance_id
    }

    async _call(input: string): Promise<string> {
        try {
            let imagePath = '',
                chat_id = '',
                caption = ''

            // Check if input is JSON or natural language
            try {
                // Attempt to parse as JSON
                const parsedInput = JSON.parse(input)
                if (typeof parsedInput === 'object' && parsedInput.image_path && parsedInput.chat_id) {
                    imagePath = parsedInput.image_path
                    // Check if chat_id starts with 0, add prefix '2' if it does
                    chat_id = parsedInput.chat_id.toString().startsWith('0') ? '2' + parsedInput.chat_id : parsedInput.chat_id
                    caption = parsedInput.caption || ''
                } else {
                    throw new Error('Invalid JSON format')
                }
            } catch {
                // If it's not JSON, assume natural language format
                const chatIdMatch = input.match(/chat Number\s*:\s*(\d+)/i)
                const imagePathMatch = input.match(/image path is\s*([^\s]+)/i)
                const captionMatch = input.match(/caption\s*(.+?)(?:\.|$)/i)

                if (chatIdMatch && imagePathMatch) {
                    chat_id = chatIdMatch[1]
                    imagePath = imagePathMatch[1]
                    caption = captionMatch ? captionMatch[1].trim() : ''
                } else {
                    throw new Error(
                        `Input didn't match expected formats. Input should either be JSON structured like {"image_path": "path/to/image.jpg", "chat_id": "number", "caption": "optional text"} or in natural language like "here is the chat Number: 12345 and the image path is path/to/image.jpg with caption This is my image." `
                    )
                }
            }

            // Validate required fields
            if (!chat_id) {
                throw new Error('Chat ID was not provided in the input!')
            }
            if (!imagePath) {
                throw new Error('Image path was not provided in the input!')
            }
            if (!this.apiToken) {
                throw new Error('API Token is required but not provided!')
            }

            // Check if the image exists if it's a local path
            let imageBuffer
            let fileName

            if (imagePath.startsWith('http')) {
                // Handle image URL
                const response = await axios.get(imagePath, { responseType: 'arraybuffer' })
                imageBuffer = Buffer.from(response.data, 'binary')
                fileName = path.basename(imagePath)
            } else {
                // Handle local file path
                if (!fs.existsSync(imagePath)) {
                    throw new Error(`Image file not found at path: ${imagePath}`)
                }
                imageBuffer = fs.readFileSync(imagePath)
                fileName = path.basename(imagePath)
            }

            // Validate image format
            const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
            const fileExt = path.extname(fileName).toLowerCase()
            if (!validExtensions.includes(fileExt)) {
                throw new Error(`Unsupported image format: ${fileExt}. Supported formats are: jpg, jpeg, png, webp, gif.`)
            }

            // Check file size (5MB limit)
            const fileSizeInMB = imageBuffer.length / (1024 * 1024)
            if (fileSizeInMB > 5) {
                throw new Error(`Image size exceeds 5MB limit. Current size: ${fileSizeInMB.toFixed(2)}MB`)
            }

            const url = `https://waconnect.aimicromind.com/api/v1/${this.instance_id}/send-image`

            // Create FormData and append fields
            const formData = new FormData()
            formData.append('token', this.apiToken)
            formData.append('chat_id', chat_id)
            if (caption) {
                formData.append('caption', caption)
            }
            formData.append('media', imageBuffer, { filename: fileName })

            console.log('Attempting to send WhatsApp image...', { chat_id, imagePath, caption })

            // Execute the API call
            const axiosResponse = await axios.post(url, formData, {
                headers: {
                    ...formData.getHeaders()
                }
            })

            if (axiosResponse.data && axiosResponse.data.ok) {
                console.log('Image sent successfully!')
                return `Image sent successfully to this number '${chat_id}'!`
            } else {
                console.error('WhatsApp API response:', axiosResponse.data)
                throw new Error(`WhatsApp API error: ${JSON.stringify(axiosResponse.data)}`)
            }
        } catch (error) {
            console.error('Error in WhatsappImageTool:', error.message)
            return `${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
}
