import { Paginator, WhereOperator, whereOperatorKeySuffix } from '@repo/types'

export default class Manifest {
  /**
   * The Manifest backend base URL (Without ending slash).
   */
  baseUrl: string

  /**
   * The slug of the entity to query.
   */
  private slug: string

  /**
   * A flag to determine if the entity is a single entity or a collection.
   */
  isSingleEntity: boolean = false

  /**
   * The headers of the request.
   */
  private headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  /**
   * The query parameters of the request.
   */
  private queryParams: { [key: string]: string } = {}

  /**
   * Create a new instance of the client.
   *
   * @param baseUrl The Manifest backend URL address (Without ending slash). Default: http://localhost:1111
   */
  constructor(baseUrl: string = 'http://localhost:1111') {
    this.baseUrl = baseUrl + '/api'
    this.slug = ''
  }

  /**
   * Set the slug of the entity to query.
   *
   * @param slug The slug of the entity to query.
   *
   * @returns The current instance of the client.
   * @example client.from('cats').find();
   */
  from(slug: string): this {
    this.slug = slug
    this.isSingleEntity = false
    this.queryParams = {}
    return this
  }

  /**
   * Set the slug of the single entity to query.
   *
   * @param slug The slug of the single entity to query.
   *
   * @returns an object containing the methods to get and update the single entity.
   *
   * @example client.single('about').get()
   * @example client.single('home').update({ title: 'New title' })
   */
  single(slug: string): {
    get: <T>() => Promise<T>
    update: <T>(data: unknown) => Promise<T>
  } {
    this.slug = slug
    this.isSingleEntity = true
    this.queryParams = {}

    return {
      /**
       * Fetches a single entity by slug.
       *
       * @returns A Promise resolving to the single entity.
       */
      get: async <T>(): Promise<T> => {
        return this.fetch({
          path: `/singles/${this.slug}`
        }) as Promise<T>
      },
      /**
       * Updates a single entity by slug.
       *
       * @param data The data to update the single entity with.
       * @returns A Promise resolving to the updated single entity.
       */
      update: async <T>(data: unknown): Promise<T> => {
        return this.fetch({
          path: `/singles/${this.slug}`,
          method: 'PUT',
          body: data
        }) as Promise<T>
      }
    }
  }

  /**
   * Get the paginated list of items of the entity.
   *
   * @param paginationParams - Optional pagination parameters.
   *
   * @returns A Promise that resolves a Paginator object containing entities of type T, based on the input.
   */
  async find<T>(paginationParams?: {
    page?: number
    perPage?: number
  }): Promise<Paginator<T>> {
    return this.fetch({
      path: `/collections/${this.slug}`,
      queryParams: {
        ...this.queryParams,
        ...paginationParams
      }
    }) as Promise<Paginator<T>>
  }

  /**
   * Get an item of the entity.
   *
   * @param id The id of the item to get.
   *
   * @returns The item of the entity.
   * @example client.from('cats').findOne(1);
   *
   **/
  async findOneById<T>(id: number): Promise<T> {
    return this.fetch({
      path: `/collections/${this.slug}/${id}`
    }) as Promise<T>
  }

  /**
   * Create an item of the entity.
   *
   * @param itemDto The DTO of the item to create.
   *
   * @returns The created item.
   */
  async create<T>(itemDto: unknown): Promise<T> {
    return this.fetch({
      path: `/collections/${this.slug}`,
      method: 'POST',
      body: itemDto
    }) as Promise<T>
  }

  /**
   * Update an item of the entity.
   *
   * @param id The id of the item to update.
   * @param itemDto The DTO of the item to update.
   *
   * @returns The updated item.
   * @example client.from('cats').update(1, { name: 'updated name' });
   */
  async update<T>(id: number, itemDto: unknown): Promise<T> {
    return this.fetch({
      path: `/collections/${this.slug}/${id}`,
      method: 'PUT',
      body: itemDto
    }) as Promise<T>
  }

  /**
   *
   * Delete an item of the entity.
   *
   * @param id The id of the item to delete.
   *
   * @returns The id of the deleted item.
   * @example client.from('cats').delete(1);
   */
  async delete(id: number): Promise<number> {
    return this.fetch({
      path: `/collections/${this.slug}/${id}`,
      method: 'DELETE'
    }).then(() => id)
  }

  /**
   *
   * Adds a where clause to the query.
   *
   * @param whereClause The where clause to add.
   *
   * @returns The current instance of the client.
   * @example client.from('cats').where('age = 10').find();
   */
  where(whereClause: string): this {
    // Check if the where clause includes one of the available operators (between spaces). We reverse array as some operators are substrings of others (ex: >= and >).
    const whereOperator: WhereOperator = Object.values(WhereOperator)
      .reverse()
      .find((operator) =>
        whereClause.includes(` ${operator} `)
      ) as WhereOperator

    if (!whereOperator) {
      throw new Error(
        `Invalid where clause. Where clause must include one of the following operators: ${Object.values(
          WhereOperator
        ).join(', ')}.`
      )
    }

    const [propName, propValue] = whereClause
      .split(whereOperator)
      .map((str) => str.trim())

    const suffix: string = whereOperatorKeySuffix[whereOperator]
    this.queryParams[propName + suffix] = propValue

    return this
  }

  /**
   * Adds a where clause to the query.
   *
   * @param whereClause
   * @returns The current instance of the client.
   * @example client.from('cats').andWhere('age = 10').find();
   */
  andWhere(whereClause: string): this {
    return this.where(whereClause)
  }

  /**
   * Adds an order by clause to the query.
   *
   * @param propName The property name to order by.
   * @param order The order of the property (ASC or DESC). Default ASC
   *
   * @returns The current instance of the client.
   * @example client.from('cats').orderBy('age', { desc: true }).find();
   */
  orderBy(propName: string, order?: { desc: boolean }): this {
    this.queryParams['orderBy'] = propName
    this.queryParams['order'] = order?.desc ? 'DESC' : 'ASC'

    return this
  }

  /**
   * Loads the relations of the entity.
   *
   * @param relations The relations to load.
   *
   * @returns The current instance of the client.
   * @example client.from('cats').with(['owner', 'owner.company']).find();
   */
  with(relations: string[]): this {
    this.queryParams['relations'] = relations.join(',')

    return this
  }

  /**
   *
   * Login as any authenticable entity.
   *
   * @param entitySlug The slug of the entity to login as.
   * @param email The email of the entity to login as.
   * @param password The password of the entity to login as.
   *
   * @returns true if the login was successful.
   */
  async login(
    entitySlug: string,
    email: string,
    password: string
  ): Promise<boolean> {
    const response: { token: string } = (await this.fetch({
      path: `/auth/${entitySlug}/login`,
      method: 'POST',
      body: {
        email,
        password
      }
    })) as { token: string }

    this.headers['Authorization'] = `Bearer ${response.token}`

    return true
  }

  /**
   *
   * Logout as any authenticable entity.
   *
   * @returns void
   */
  logout(): void {
    delete this.headers['Authorization']
  }

  /**
   * Signup as any authenticable entity but Admin and login.
   *
   * @param entitySlug The slug of the entity to signup as.
   * @param email The email of the entity to signup as.
   * @param password The password of the entity to signup as.
   *
   * @returns true if the signup was successful.
   */
  async signup(
    entitySlug: string,
    email: string,
    password: string
  ): Promise<boolean> {
    const response: { token: string } = (await this.fetch({
      path: `/auth/${entitySlug}/signup`,
      method: 'POST',
      body: {
        email,
        password
      }
    })) as { token: string }

    this.headers['Authorization'] = `Bearer ${response.token}`

    return true
  }

  /**
   * Gets the current logged in user (me). Use "from('your-entity')" before calling this method.
   *
   * @returns The current logged in user.
   * @example client.from('users').me();
   *
   */
  async me(): Promise<{ email: string }> {
    return this.fetch({
      path: `/auth/${this.slug}/me`
    }) as Promise<{ email: string }>
  }

  private fetch({
    path,
    method,
    body,
    queryParams
  }: {
    path: string
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: unknown
    queryParams?: Record<string, string | number | boolean>
  }): Promise<unknown> {
    const url = new URL(this.baseUrl + path)

    Object.entries(queryParams || []).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value.toString())
      }
    })

    return fetch(url.toString(), {
      headers: this.headers,
      method: method || 'GET',
      body: body ? JSON.stringify(body) : undefined
    }).then((res) => res.json())
  }

  /**
   * Upload a file to the entity.
   *
   * @param property The property of the entity to upload the file to.
   * @param file The file to upload.
   *
   * @returns true if the upload was successful.
   */
  async upload(property: string, file: Blob): Promise<boolean> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('entity', this.slug)
    formData.append('property', property)

    await fetch(`${this.baseUrl}/upload/file`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: this.headers['Authorization']
      }
    }).catch((err) => {
      console.error(err)
      return {}
    })

    return true
  }

  /**
   * Upload an image to the entity.
   *
   * @param property The property of the entity to upload the image to.
   * @param image The image to upload.
   *
   * @returns an object containing the path of the uploaded image in different sizes.
   * */
  async uploadImage(
    property: string,
    image: Blob
  ): Promise<{ [key: string]: string }> {
    const formData = new FormData()
    formData.append('image', image)
    formData.append('entity', this.slug)
    formData.append('property', property)

    return fetch(`${this.baseUrl}/upload/image`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: this.headers['Authorization']
      }
    })
      .then((res) => res.json())
      .catch((err) => {
        console.error(err)
        return {}
      })
  }

  /**
   * Helper that returns the absolute URL of the image.
   *
   * @param image The image object containing the different sizes of the image.
   *
   * @returns The absolute URL of the image.
   */
  imageUrl(image: { [key: string]: string }, size: string): string {
    return `${this.baseUrl.replace(/\/api$/, '')}/storage/${image[size]}`
  }
}
