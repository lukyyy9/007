const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tactical Card Game API',
      version: '1.0.0',
      description: 'API documentation for the Tactical Card Game server',
      contact: {
        name: 'API Support',
        email: 'support@tacticalgame.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User unique identifier'
            },
            username: {
              type: 'string',
              description: 'User username'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the user account is active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            lastLoginAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp'
            }
          }
        },
        Game: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Game unique identifier'
            },
            name: {
              type: 'string',
              description: 'Game name'
            },
            status: {
              type: 'string',
              enum: ['waiting', 'active', 'completed'],
              description: 'Current game status'
            },
            phase: {
              type: 'string',
              enum: ['waiting', 'selection', 'playing', 'ended'],
              description: 'Current game phase'
            },
            currentTurn: {
              type: 'integer',
              description: 'Current turn number'
            },
            player1Health: {
              type: 'integer',
              description: 'Player 1 current health'
            },
            player2Health: {
              type: 'integer',
              description: 'Player 2 current health'
            },
            gameConfig: {
              type: 'object',
              description: 'Game configuration settings'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            player1: {
              $ref: '#/components/schemas/User'
            },
            player2: {
              $ref: '#/components/schemas/User'
            },
            winner: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        Tournament: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Tournament unique identifier'
            },
            name: {
              type: 'string',
              description: 'Tournament name'
            },
            format: {
              type: 'string',
              enum: ['single-elimination', 'double-elimination'],
              description: 'Tournament format'
            },
            status: {
              type: 'string',
              enum: ['waiting', 'active', 'completed'],
              description: 'Tournament status'
            },
            maxPlayers: {
              type: 'integer',
              description: 'Maximum number of players'
            },
            currentRound: {
              type: 'integer',
              description: 'Current tournament round'
            },
            gameConfig: {
              type: 'object',
              description: 'Game configuration for tournament matches'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            creator: {
              $ref: '#/components/schemas/User'
            },
            winner: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            },
            details: {
              type: 'string',
              description: 'Additional error details'
            }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: 'Field name with validation error'
                  },
                  message: {
                    type: 'string',
                    description: 'Validation error message'
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/index.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi,
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Tactical Card Game API Documentation'
  })
};