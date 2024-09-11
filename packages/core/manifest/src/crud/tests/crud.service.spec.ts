import { CrudService } from '../services/crud.service'
import { Test, TestingModule } from '@nestjs/testing'
import { ManifestService } from '../../manifest/services/manifest.service'
import { PaginationService } from '../services/pagination.service'
import { EntityService } from '../../entity/services/entity.service'
import { ValidationService } from '../../validation/services/validation.service'

describe('CrudService', () => {
  let service: CrudService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrudService,
        {
          provide: ManifestService,
          useValue: {
            getEntityRepository: jest.fn()
          }
        },
        {
          provide: PaginationService,
          useValue: {
            paginate: jest.fn()
          }
        },
        {
          provide: EntityService,
          useValue: {
            findOne: jest.fn()
          }
        },
        {
          provide: ValidationService,
          useValue: {
            validate: jest.fn()
          }
        }
      ]
    }).compile()

    service = module.get<CrudService>(CrudService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
