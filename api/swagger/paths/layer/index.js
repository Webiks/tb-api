module.exports = {
  'x-swagger-router-controller': 'layerId',
  post: {
    tags: ['Layers'],
    description: 'Upload image file.',
    operationId: 'uploadImage',
    consumes: ['multipart/form-data'],
    parameters: [
      {
        name: 'description',
        description: 'description',
        in: 'formData',
        type: 'string',
        required: false
      },
      {
        name: 'creditName ',
        description: 'name of credit',
        in: 'formData',
        type: 'string',
        required: false
      },
      {
        name: 'sensorType',
        description: 'the sensor\'s type',
        in: 'formData',
        type: 'string',
        required: true
      },
      {
        name: 'sensorName',
        description: 'the sensor\'s name',
        in: 'formData',
        type: 'string',
        enum: ['Phantom 3', 'Phantom 4', 'Phantom 4 Advanced', 'Phantom 4 Pro', 'Mavic', 'Mavic Pro', 'Mavic 2', 'Spark', 'Inspire'],
        required: false
      },
      {
        name: 'sharing',
        description: 'the world\'s name',
        in: 'formData',
        type: 'string',
        required: true,
        default: 'public'
      },
      {
        name: 'uploads',
        description: 'the upload\'s files',
        in: 'formData',
        type: 'file',
        required: false
      }
    ],
    responses: {
      200: {
        description: 'Upload Success',
        schema: {
          required: ['message'],
          properties: {
            message: {
              type: 'string'
            }
          }
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
