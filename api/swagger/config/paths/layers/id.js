module.exports = {
  'x-swagger-router-controller': 'layers',
  get: {
    tags: ['Layers'],
    description: 'Get layer by id',
    operationId: 'fetchLayer',
    parameters: [
      {
        name: 'id',
        description: 'id',
        in: 'path',
        type: 'string',
        required: true
      }
    ],
    responses: {
      200: {
        description: 'Get layer By id',
        schema: {
          type: 'object'
        }
      },
      default: {
        description: 'Error',
        schema: {
          required: ['message'],
          properties: {
            message: {
              type: 'string'
            }
          }
        }
      }
    }
  }
};
