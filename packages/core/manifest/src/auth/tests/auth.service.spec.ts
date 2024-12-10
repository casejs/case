import { HttpException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import * as jwt from 'jsonwebtoken'
import { AuthService } from '../auth.service'
import { EntityService } from '../../entity/services/entity.service'
import { ADMIN_ENTITY_MANIFEST } from '../../constants'
import { ManifestService } from '../../manifest/services/manifest.service'

describe('AuthService', () => {
  let authService: AuthService
  let configService: ConfigService
  let entityService: EntityService
  let manifestService: ManifestService

  const mockUser = {
    email: 'testEmail',
    password: 'testHashedPassword'
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-jwt-secret')
          }
        },
        {
          provide: EntityService,
          useValue: {
            getEntityRepository: jest.fn().mockReturnValue({
              findOne: jest.fn().mockReturnValue(Promise.resolve(mockUser))
            })
          }
        },
        {
          provide: ManifestService,
          useValue: {
            getEntityManifest: jest.fn().mockReturnValue(ADMIN_ENTITY_MANIFEST)
          }
        }
      ]
    }).compile()

    authService = module.get<AuthService>(AuthService)
    configService = module.get<ConfigService>(ConfigService)
    entityService = module.get<EntityService>(EntityService)
    manifestService = module.get<ManifestService>(ManifestService)
  })

  describe('createToken', () => {
    it('should return a valid JWT token if a user is found', async () => {
      const result = await authService.createToken(
        ADMIN_ENTITY_MANIFEST.slug,
        mockUser
      )
      expect(result).toHaveProperty('token')

      const decodedPayload = jwt.decode(result.token)
      expect(decodedPayload).toHaveProperty('email', 'testEmail')
    })

    it('should throw an exception when no user is found', async () => {
      // No user found.
      entityService.getEntityRepository = jest.fn().mockReturnValue({
        findOne: jest.fn().mockReturnValue(Promise.resolve(null))
      })

      expect(async () => {
        await authService.createToken(ADMIN_ENTITY_MANIFEST.slug, {
          email: 'unknownUserEmail',
          password: 'testPlainPassword'
        })
      }).rejects.toThrow(HttpException)
    })
  })

  describe('getUserFromToken', () => {
    it('should return a user when the token decodes to a valid email', async () => {
      entityService.getEntityRepository = jest.fn().mockReturnValue({
        findOne: jest.fn().mockReturnValue(Promise.resolve(mockUser))
      })

      const { token } = await authService.createToken(
        ADMIN_ENTITY_MANIFEST.slug,
        mockUser
      )

      const response = await authService.getUserFromToken(token)

      expect(response.user).toHaveProperty('email', mockUser.email)
      expect(response.entitySlug).toBe(ADMIN_ENTITY_MANIFEST.slug)
    })

    it('should return an object with null user and entity slug when the token does not decode to a valid email', async () => {
      entityService.getEntityRepository = jest.fn().mockReturnValue({
        findOne: jest.fn().mockReturnValue(Promise.resolve(null))
      })

      const { jwtToken, entitySlug } = jwt.sign(
        'nonexistent@email.com',
        configService.get('tokenSecretKey')
      )

      expect(await authService.getUserFromToken(jwtToken)).toMatchObject({
        user: null,
        entitySlug: null
      })
    })
  })
})
