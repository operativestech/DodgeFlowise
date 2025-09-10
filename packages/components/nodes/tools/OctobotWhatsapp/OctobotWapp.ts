import axios from 'axios'
import { z } from 'zod'
import { CallbackManagerForToolRun } from '@langchain/core/callbacks/manager'
import { StructuredTool, ToolParams } from '@langchain/core/tools'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import * as fs from 'fs'
import * as path from 'path'
import FormData from 'form-data'
import * as os from 'os'

// Constants
const TOOL_NAME = 'OctobotWappTool'
const TOOL_DESC = `Send WhatsApp messages or create groups via OctobotWapp API.
Input parameters:
- recipients: For messages: comma-separated numbers or group IDs. For group creation: comma-separated participant numbers
- text_message: For messages: the text to send. For group creation: the group name/subject
- group_picture_url (optional): URL of the group picture when creating groups`

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
        this.description = 'Send WhatsApp messages or create groups via OctobotWapp API'
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
                    },
                    {
                        label: 'Create Group',
                        name: 'create_group'
                    }
                ],
                default: 'text',
                description: 'Type of message to send or create group'
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
        if (type_message !== 'text' && type_message !== 'create_group' && !media_path) {
            throw new Error(`Media file path is required for ${type_message} messages`)
        }

        // Validate timezone if scheduling
        if (time_to_send && !timezone) {
            throw new Error('Timezone is required when scheduling is enabled')
        }

        console.log(`Initializing OctobotWapp tool with device: ${deviceName || 'Unknown Device'}`)

        // Update schema based on message type
        const schema =
            type_message === 'create_group'
                ? z.object({
                      recipients: z.string().describe('Comma-separated participant phone numbers (e.g., "201110076346,201110076347")'),
                      text_message: z.string().describe('The group name/subject'),
                      group_picture_url: z.string().optional().describe('URL of the group picture (optional)')
                  })
                : z.object({
                      recipients: z
                          .string()
                          .describe(
                              type_contact === 'group'
                                  ? 'Comma-separated group IDs (e.g., "120363123456789012@g.us" or multiple groups)'
                                  : 'Comma-separated phone numbers (e.g., "201110076346" or "201110076346,201110076347")'
                          ),
                      text_message: z.string().describe('The message text to send')
                  })

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
            schema
        })
    }
}

// Tool implementation
type OctobotWappToolParams = ToolParams
type OctobotWappToolInput = {
    name: string
    description: string
    apiToken: string
    device_uuid: string
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
    deviceName?: string
    apiUrl: string
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
        this.deviceName = options.deviceName
        this.apiUrl = options.apiUrl
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
            deviceName: options.deviceName,
            apiUrl: options.apiUrl,
            type_message: options.type_message,
            type_contact: options.type_contact,
            media_path: options.media_path,
            time_to_send: options.time_to_send,
            timezone: options.timezone,
            schema: options.schema
        })
    }

    // Helper to download image from URL
    private async downloadImage(url: string): Promise<string | null> {
        try {
            const response = await axios.get(url, {
                responseType: 'stream',
                timeout: 30000
            })

            const tempDir = os.tmpdir()
            const fileName = `group_picture_${Date.now()}.jpg`
            const filePath = path.join(tempDir, fileName)

            const writer = fs.createWriteStream(filePath)
            response.data.pipe(writer)

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(filePath))
                writer.on('error', reject)
            })
        } catch (error) {
            console.error('Failed to download group picture:', error)
            return null
        }
    }

    protected async _call(arg: z.infer<typeof this.schema>, runManager?: CallbackManagerForToolRun): Promise<string> {
        try {
            // Handle group creation
            if (this.type_message === 'create_group') {
                const { recipients, text_message, group_picture_url } = arg as any

                const formData = new FormData()
                formData.append('deviceUuid', this.device_uuid)
                formData.append('subject', text_message)
                formData.append('participants', recipients)

                // Handle group picture if URL provided
                let tempImagePath: string | null = null
                if (group_picture_url) {
                    tempImagePath = await this.downloadImage(group_picture_url)
                    if (tempImagePath) {
                        const fileStream = fs.createReadStream(tempImagePath)
                        formData.append('groupPicture', fileStream, path.basename(tempImagePath))
                    }
                }

                console.log(`Creating WhatsApp group: ${text_message}`)

                const response = await axios.post('https://api.zentramsg.com/v1/whatsapp/groups/create', formData, {
                    headers: {
                        accept: 'application/json',
                        'x-api-token': this.apiToken,
                        ...formData.getHeaders()
                    },
                    timeout: 60000
                })

                // Clean up temp file
                if (tempImagePath) {
                    try {
                        fs.unlinkSync(tempImagePath)
                    } catch (e) {
                        /* empty */
                    }
                }

                if (response.data && response.data.success === true) {
                    return JSON.stringify({
                        success: true,
                        message: `WhatsApp group "${text_message}" created successfully`,
                        details: response.data.data || response.data
                    })
                } else {
                    return JSON.stringify({
                        success: false,
                        error: response.data.msg || 'Failed to create group',
                        details: response.data
                    })
                }
            }

            // Handle regular messages (existing functionality)
            const { recipients, text_message } = arg

            const formData = new FormData()
            formData.append('device_uuid', this.device_uuid)
            formData.append('type_message', this.type_message)
            formData.append('type_contact', this.type_contact)
            formData.append('ids', recipients)

            if (this.time_to_send) {
                formData.append('time_to_send', this.time_to_send)
                if (this.timezone) {
                    formData.append('timezone', this.timezone)
                }
            }

            if (this.type_message === 'text') {
                formData.append('text_message', text_message)
            } else {
                if (text_message) {
                    formData.append('text_message', text_message)
                }

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

            const response = await axios.post(this.apiUrl, formData, {
                headers: {
                    'x-api-token': this.apiToken,
                    ...formData.getHeaders()
                },
                timeout: 30000
            })

            if (response.data && response.data.success === true) {
                return JSON.stringify({
                    success: true,
                    message: `${this.type_message.toUpperCase()} message sent successfully to ${recipients}`,
                    details: response.data.data
                })
            } else {
                return JSON.stringify({
                    success: false,
                    error: response.data.msg || 'Unknown error',
                    details: response.data
                })
            }
        } catch (error: any) {
            console.error('Error in OctobotWappTool:', error.message)
            return JSON.stringify({
                success: false,
                error: error.message || 'An unexpected error occurred',
                details: error.response?.data || 'No additional details available'
            })
        }
    }
}

module.exports = { nodeClass: OctobotWapp_Tools }
