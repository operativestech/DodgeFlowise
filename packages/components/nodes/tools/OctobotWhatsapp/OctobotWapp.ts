import axios from 'axios'
import { z } from 'zod'
import { CallbackManagerForToolRun } from '@langchain/core/callbacks/manager'
import { StructuredTool, ToolParams } from '@langchain/core/tools'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import * as fs from 'fs'
import * as path from 'path'
import FormData from 'form-data'

// Constants
const TOOL_NAME = 'OctobotWappTool'
const TOOL_DESC = `Send WhatsApp messages via OctobotWapp API.
Input parameters:
- recipients: For phone numbers: comma-separated numbers (e.g., "201110076346,201110076347")
              For groups: comma-separated group IDs (e.g., "120363123456789012@g.us")
- text_message: The message text to send`
// Node implementation
class OctobotWapp_Tools implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'OctobotWapp DODGE'
        this.name = 'OctobotWapp'
        this.version = 1.0
        this.type = 'OctobotWapp'
        this.icon = 'OctobotWapp.svg'
        this.category = 'Communication'
        this.description = 'Send WhatsApp messages via OctobotWapp API'
        this.baseClasses = [this.type, 'Tool', ...getBaseClasses(OctobotWappTool)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['octobotWappApi'],
            description: 'Select OctobotWapp credentials'
        }
        this.inputs = [
            {
                label: 'Tool Name',
                name: 'toolName',
                type: 'string',
                description: 'Specify the name of the tool',
                default: TOOL_NAME
            },
            {
                label: 'Tool Description',
                name: 'toolDesc',
                type: 'string',
                rows: 4,
                description: 'Specify the description of the tool',
                default: TOOL_DESC
            },
            {
                label: 'Message Type',
                name: 'type_message',
                type: 'options',
                options: [
                    {
                        label: 'Text Message',
                        name: 'text'
                    },
                    {
                        label: 'Image Message',
                        name: 'image'
                    },
                    {
                        label: 'Video Message',
                        name: 'video'
                    },
                    {
                        label: 'Document Message',
                        name: 'doc'
                    }
                ],
                default: 'text',
                description: 'Type of message to send'
            },
            {
                label: 'Recipient Type',
                name: 'type_contact',
                type: 'options',
                options: [
                    {
                        label: 'Phone Numbers',
                        name: 'numbers'
                    },
                    {
                        label: 'Group IDs',
                        name: 'group'
                    }
                ],
                default: 'numbers',
                description: 'Type of recipients'
            },
            {
                label: 'Media File Path',
                name: 'media_path',
                type: 'string',
                description: 'Full path to media file (required for image/video/document messages)',
                placeholder: '/path/to/file.jpg',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Schedule Time',
                name: 'time_to_send',
                type: 'string',
                description: 'Schedule time in format: YYYY-MM-DD HH:mm:ss (leave empty for immediate sending)',
                placeholder: 'e.g., 2025-05-20 11:33:00',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Timezone',
                name: 'timezone',
                type: 'string',
                description: 'Timezone for scheduled message (required if time_to_send is set)',
                placeholder: 'e.g., Asia/Riyadh',
                optional: true,
                additionalParams: true
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        // Disable tracing if hitting rate limits
        if (process.env.LANGCHAIN_TRACING_V2 === 'true' && !process.env.DISABLE_TRACING) {
            // Check if we should disable tracing due to rate limits
            try {
                // You can add logic here to track rate limit errors
            } catch (error) {
                process.env.LANGCHAIN_TRACING_V2 = 'false'
                console.warn('Disabling LangChain tracing due to rate limits')
            }
        }

        const toolName = nodeData.inputs?.toolName as string
        const toolDesc = nodeData.inputs?.toolDesc as string
        const type_message = (nodeData.inputs?.type_message as string) || 'text'
        const type_contact = (nodeData.inputs?.type_contact as string) || 'numbers'
        const media_path = nodeData.inputs?.media_path as string
        const time_to_send = nodeData.inputs?.time_to_send as string
        const timezone = nodeData.inputs?.timezone as string

        // Get credentials
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apiToken = getCredentialParam('apiToken', credentialData, nodeData)
        const device_uuid = getCredentialParam('deviceUuid', credentialData, nodeData)
        const deviceName = getCredentialParam('deviceName', credentialData, nodeData)
        const apiUrl = getCredentialParam('apiUrl', credentialData, nodeData) || 'https://api.zentramsg.com/v1/messages'

        // Validate credentials
        if (!apiToken) {
            throw new Error('API Token is required in credentials')
        }

        if (!device_uuid) {
            throw new Error('Device UUID is required in credentials')
        }

        // Validate media path for non-text messages
        if (type_message !== 'text' && !media_path) {
            throw new Error(`Media file path is required for ${type_message} messages`)
        }

        // Validate timezone if scheduling
        if (time_to_send && !timezone) {
            throw new Error('Timezone is required when scheduling is enabled')
        }

        console.log(`Initializing OctobotWapp tool with device: ${deviceName || 'Unknown Device'}`)

        return await OctobotWappTool.initialize({
            name: toolName ?? TOOL_NAME,
            description: toolDesc ?? TOOL_DESC,
            apiToken,
            device_uuid,
            deviceName,
            apiUrl,
            type_message,
            type_contact,
            media_path,
            time_to_send,
            timezone,
            // In the init method, update the schema based on type_contact
            schema: z.object({
                recipients: z
                    .string()
                    .describe(
                        type_contact === 'group'
                            ? 'Comma-separated group IDs (e.g., "120363123456789012@g.us" or multiple groups)'
                            : 'Comma-separated phone numbers (e.g., "201110076346" or "201110076346,201110076347")'
                    ),
                text_message: z.string().describe('The message text to send')
            })
        })
    }
}

// Tool implementation
type OctobotWappToolParams = ToolParams
type OctobotWappToolInput = {
    name: string
    description: string
    apiToken: string
    device_uuid: string // Changed from deviceUuid
    deviceName?: string
    apiUrl: string
    type_message: string
    type_contact: string
    media_path?: string
    time_to_send?: string
    timezone?: string
    schema: any
}

export class OctobotWappTool extends StructuredTool {
    static lc_name() {
        return 'OctobotWappTool'
    }

    name = TOOL_NAME
    description = TOOL_DESC
    apiToken: string
    device_uuid: string
    deviceName?: string // Added
    apiUrl: string // Added
    type_message: string
    type_contact: string
    media_path?: string
    time_to_send?: string
    timezone?: string
    schema: any

    constructor(options: OctobotWappToolParams & OctobotWappToolInput) {
        super(options)
        this.name = options.name
        this.description = options.description
        this.apiToken = options.apiToken
        this.device_uuid = options.device_uuid
        this.deviceName = options.deviceName // Added
        this.apiUrl = options.apiUrl // Added
        this.type_message = options.type_message
        this.type_contact = options.type_contact
        this.media_path = options.media_path
        this.time_to_send = options.time_to_send
        this.timezone = options.timezone
        this.schema = options.schema
    }

    static async initialize(options: Partial<OctobotWappToolParams> & OctobotWappToolInput) {
        return new this({
            name: options.name,
            description: options.description,
            apiToken: options.apiToken,
            device_uuid: options.device_uuid,
            deviceName: options.deviceName, // Added
            apiUrl: options.apiUrl, // Added
            type_message: options.type_message,
            type_contact: options.type_contact,
            media_path: options.media_path,
            time_to_send: options.time_to_send,
            timezone: options.timezone,
            schema: options.schema
        })
    }

    // Helper method to validate phone numbers
    private validatePhoneNumber(phone: string): boolean {
        return /^\d{10,15}$/.test(phone.replace(/\D/g, ''))
    }
    // Add this method to the OctobotWappTool class
    private validateGroupId(groupId: string): boolean {
        // WhatsApp group IDs typically follow this pattern
        return /^\d{15,20}@g\.us$/.test(groupId.trim()) || /^\d{15,20}-\d{10}@g\.us$/.test(groupId.trim())
    }
    // Helper method to validate file
    private validateMediaFile(filePath: string): void {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Media file not found at path: ${filePath}`)
        }

        const stats = fs.statSync(filePath)
        const maxSize = 16 * 1024 * 1024 // 16MB WhatsApp limit

        if (stats.size > maxSize) {
            throw new Error(`File size (${(stats.size / 1024 / 1024).toFixed(2)}MB) exceeds WhatsApp limit of 16MB`)
        }

        // Optional: Add file type validation
        const ext = path.extname(filePath).toLowerCase()
        const validExtensions: { [key: string]: string[] } = {
            image: ['.jpg', '.jpeg', '.png', '.webp'],
            video: ['.mp4', '.3gp', '.avi'],
            doc: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
        }

        if (this.type_message !== 'text' && validExtensions[this.type_message]) {
            if (!validExtensions[this.type_message].includes(ext)) {
                throw new Error(
                    `Invalid file type ${ext} for ${this.type_message} message. Allowed: ${validExtensions[this.type_message].join(', ')}`
                )
            }
        }
    }

    protected async _call(arg: z.infer<typeof this.schema>, runManager?: CallbackManagerForToolRun): Promise<string> {
        try {
            // Extract inputs from the schema
            const { recipients, text_message } = arg

            // Create FormData for the API request
            const formData = new FormData()
            formData.append('device_uuid', this.device_uuid)
            formData.append('type_message', this.type_message)
            formData.append('type_contact', this.type_contact)
            formData.append('ids', recipients)

            // Add scheduling parameters if configured
            if (this.time_to_send) {
                formData.append('time_to_send', this.time_to_send)
                if (this.timezone) {
                    formData.append('timezone', this.timezone)
                }
            }

            // Handle different message types
            if (this.type_message === 'text') {
                formData.append('text_message', text_message)
            } else {
                // For media messages, use text_message as caption
                if (text_message) {
                    formData.append('text_message', text_message)
                }

                // Add media file
                if (!this.media_path) {
                    throw new Error(`Media file path is required for ${this.type_message} messages`)
                }

                if (!fs.existsSync(this.media_path)) {
                    throw new Error(`Media file not found at path: ${this.media_path}`)
                }

                const fileStream = fs.createReadStream(this.media_path)
                const fileName = path.basename(this.media_path)
                formData.append('media', fileStream, fileName)
            }

            console.log(`Sending ${this.type_message} message to: ${recipients}`)

            // Execute API call
            const response = await axios.post(this.apiUrl, formData, {
                // Use this.apiUrl instead of hardcoded URL
                headers: {
                    'x-api-token': this.apiToken,
                    ...formData.getHeaders()
                }
            })

            // Handle response
            if (response.data && response.data.success === true) {
                console.log('Message sent successfully')
                const messageType = this.type_message || 'message'
                return JSON.stringify({
                    success: true,
                    message: `${messageType.toUpperCase()} message sent successfully to ${recipients}`,
                    details: response.data.data
                })
            } else {
                console.error('API error response:', response.data)
                return JSON.stringify({
                    success: false,
                    error: response.data.msg || 'Unknown error',
                    details: response.data.errors || response.data
                })
            }
        } catch (error: any) {
            console.error('Error in OctobotWappTool:', error.message)
            return JSON.stringify({
                success: false,
                error: error.message,
                details: error.response?.data || 'No additional details available'
            })
        }
    }
}

module.exports = { nodeClass: OctobotWapp_Tools }
