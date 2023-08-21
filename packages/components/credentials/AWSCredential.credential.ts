import { INodeParams, INodeCredential } from '../src/Interface'

class AWSApi implements INodeCredential {
    label: string
    name: string
    version: number
    inputs: INodeParams[]

    constructor() {
        this.label = 'AWS API'
        this.name = 'awsApi'
        this.version = 1.0
        this.inputs = [
            {
                label: 'AWS Key',
                name: 'awsKey',
                type: 'string'
            },
            {
                label: 'AWS Secret',
                name: 'awsSecret',
                type: 'password'
            }
        ]
    }
}

module.exports = { credClass: AWSApi }
