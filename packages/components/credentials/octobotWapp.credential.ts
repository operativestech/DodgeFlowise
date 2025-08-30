import { INodeParams, INodeCredential } from '../src/Interface'

class OctobotWappApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'OctobotWapp API'
        this.name = 'octobotWappApi'
        this.version = 1.0
        this.description = 'OctobotWapp API credentials for WhatsApp messaging'
        this.inputs = [
            {
                label: 'Device Name',
                name: 'deviceName',
                type: 'string',
                description: 'A friendly name to identify this WhatsApp device',
                placeholder: 'e.g., Sales Team Phone'
            },
            {
                label: 'API Token',
                name: 'apiToken',
                type: 'password',
                description: 'Your OctobotWapp API Token',
                placeholder: 'Enter your API token'
            },
            {
                label: 'Device UUID',
                name: 'deviceUuid',
                type: 'password',
                description: 'UUID of the WhatsApp device to send from',
                placeholder: 'e.g., 123e4567-e89b-12d3-a456-426614174000'
            },
            {
                label: 'API URL',
                name: 'apiUrl',
                type: 'string',
                description: 'OctobotWapp API endpoint URL',
                default: 'https://api.zentramsg.com/v1/messages',
                optional: true
            }
        ]
    }
}

module.exports = { credClass: OctobotWappApi }
