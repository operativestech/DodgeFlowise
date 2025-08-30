import axios from 'axios'
import { Tool } from '@langchain/core/tools'
import * as fs from 'fs'
import FormData from 'form-data'
import path from 'path'

export interface WhatsappFileToolInputs {
    apiToken: string
    instance_id: string
}

/**
 * WhatsappFileTool is a class designed to send document files to WhatsApp chats.
 * It interacts with the WaConnect API for file delivery.
 */
export class WhatsappFileTool extends Tool {
    name = 'whatsappFileTool'
    description = `Send document files to Whatsapp chats.
    apiToken and instance_id are inputs to the node, and you don't ask the user to input them in the chat.
    User inputs can be in JSON format or natural language.
    A natural language string in the format:
       here is the chat Number : phone_number and the file path is file_path with caption caption_text.
       "chat_id" (string) refers to the phone number of the recipient.
       "file_path" (string) is the local path to the file or a URL.
       "caption" (string) is an optional text caption for the file.
    The output will be either "File sent successfully to Whatsapp!" in case of success, or
    an error string indicating what the error was in case of a failure.`
    returnDirect = false
    apiToken: string
    instance_id: string

    constructor(toolInput: WhatsappFileToolInputs) {
        super()
        this.apiToken = toolInput.apiToken
        this.instance_id = toolInput.instance_id
    }

    async _call(input: string): Promise<string> {
        try {
            let filePath = '',
                chat_id = '',
                caption = ''

            // Check if input is JSON or natural language
            try {
                // Attempt to parse as JSON
                const parsedInput = JSON.parse(input)
                if (typeof parsedInput === 'object' && parsedInput.file_path && parsedInput.chat_id) {
                    filePath = parsedInput.file_path

                    // Check if chat_id starts with 0, add prefix '2' if it does
                    chat_id = parsedInput.chat_id.toString().startsWith('0') ? '2' + parsedInput.chat_id : parsedInput.chat_id

                    caption = parsedInput.caption || ''
                } else {
                    throw new Error('Invalid JSON format')
                }
            } catch {
                // If it's not JSON, assume natural language format
                const chatIdMatch = input.match(/chat Number\s*:\s*(\d+)/i)
                const filePathMatch = input.match(/file path is\s*([^\s]+)/i)
                const captionMatch = input.match(/caption\s*(.+?)(?:\.|$)/i)

                if (chatIdMatch && filePathMatch) {
                    let extractedChatId = chatIdMatch[1]

                    // Check if chat_id starts with 0, add prefix '2' if it does
                    chat_id = extractedChatId.startsWith('0') ? '2' + extractedChatId : extractedChatId

                    filePath = filePathMatch[1]
                    caption = captionMatch ? captionMatch[1].trim() : ''
                } else {
                    throw new Error(
                        `Input didn't match expected formats. Input should either be JSON structured like {"file_path": "path/to/file.pdf", "chat_id": "number", "caption": "optional text"} or in natural language like "here is the chat Number: 12345 and the file path is path/to/file.pdf with caption This is my document." `
                    )
                }
            }

            // Validate required fields
            if (!chat_id) {
                throw new Error('Chat ID was not provided in the input!')
            }
            if (!filePath) {
                throw new Error('File path was not provided in the input!')
            }
            if (!this.apiToken) {
                throw new Error('API Token is required but not provided!')
            }

            // Check if the file exists if it's a local path
            let fileBuffer
            let fileName

            if (filePath.startsWith('http')) {
                // Handle file URL
                const response = await axios.get(filePath, { responseType: 'arraybuffer' })
                fileBuffer = Buffer.from(response.data, 'binary')
                fileName = path.basename(filePath)
            } else {
                // Handle local file path
                if (!fs.existsSync(filePath)) {
                    throw new Error(`File not found at path: ${filePath}`)
                }
                fileBuffer = fs.readFileSync(filePath)
                fileName = path.basename(filePath)
            }

            // Validate file format
            const validExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar']
            const fileExt = path.extname(fileName).toLowerCase()
            if (!validExtensions.includes(fileExt)) {
                throw new Error(`Unsupported file format: ${fileExt}. Supported formats are: PDF, DOC, DOCX, XLS, XLSX, ZIP, RAR.`)
            }

            const url = `https://waconnect.aimicromind.com/api/v1/${this.instance_id}/send-file`

            // Create FormData and append fields
            const formData = new FormData()
            formData.append('token', this.apiToken)
            formData.append('chat_id', chat_id)
            if (caption) {
                formData.append('caption', caption)
            }
            formData.append('media', fileBuffer, { filename: fileName })

            console.log('Attempting to send WhatsApp file...', { chat_id, filePath, caption })

            // Execute the API call
            const axiosResponse = await axios.post(url, formData, {
                headers: {
                    ...formData.getHeaders()
                }
            })

            if (axiosResponse.data && axiosResponse.data.ok) {
                console.log('File sent successfully!')
                return `File sent successfully to this number '${chat_id}'!`
            } else {
                console.error('WhatsApp API response:', axiosResponse.data)
                throw new Error(`WhatsApp API error: ${JSON.stringify(axiosResponse.data)}`)
            }
        } catch (error) {
            console.error('Error in WhatsappFileTool:', error.message)
            return `${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
}
