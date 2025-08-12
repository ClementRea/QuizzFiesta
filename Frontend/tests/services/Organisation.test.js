const OrganisationService = require('../../src/services/OrganisationService').default
const axios = require('axios')

jest.mock('axios')

describe('OrganisationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Organisation utility functions', () => {
    it('should validate correct organisation names', () => {
      expect(OrganisationService.validateOrganisationName('My Org')).toBe(true)
      expect(OrganisationService.validateOrganisationName('Org123')).toBe(true)
      expect(OrganisationService.validateOrganisationName('Organisation Test')).toBe(true)
    })

    it('should reject invalid organisation names', () => {
      expect(OrganisationService.validateOrganisationName('')).toBe(false)
      expect(OrganisationService.validateOrganisationName(null)).toBe(false)
      expect(OrganisationService.validateOrganisationName(undefined)).toBe(false)
      expect(OrganisationService.validateOrganisationName('AB')).toBe(false)
    })

    it('should validate correct organisation emails', () => {
      expect(OrganisationService.validateOrganisationEmail('org@example.com')).toBe(true)
      expect(OrganisationService.validateOrganisationEmail('contact@asso.fr')).toBe(true)
      expect(OrganisationService.validateOrganisationEmail('test.email+tag@domain.org')).toBe(true)
    })

    it('should reject invalid organisation emails', () => {
      expect(OrganisationService.validateOrganisationEmail('invalid-email')).toBe(false)
      expect(OrganisationService.validateOrganisationEmail('org@')).toBe(false)
      expect(OrganisationService.validateOrganisationEmail('')).toBe(false)
      expect(OrganisationService.validateOrganisationEmail('org@domain')).toBe(false)
    })

    it('should filter allowed organisation fields only', () => {
      const orgData = {
        name: 'My Org',
        description: 'Desc',
        email: 'org@example.com',
        phone: '0123456789',
        address: '1 rue de la Paix',
        id: '123',
        owner: 'userId',
        logo: null
      }
      const filtered = OrganisationService.filterOrganisationFields(orgData)
      expect(filtered).toEqual({
        name: 'My Org',
        description: 'Desc',
        email: 'org@example.com',
        phone: '0123456789',
        address: '1 rue de la Paix'
      })
      expect(filtered.id).toBeUndefined()
      expect(filtered.owner).toBeUndefined()
      expect(filtered.logo).toBeUndefined()
    })

    it('should handle empty or null values in filter', () => {
      const orgData = {
        name: '',
        description: null,
        email: 'org@example.com',
        phone: '',
        address: '1 rue de la Paix'
      }
      const filtered = OrganisationService.filterOrganisationFields(orgData)
      expect(filtered).toEqual({
        email: 'org@example.com',
        address: '1 rue de la Paix'
      })
    })
  })

  describe('API methods', () => {
    it('should get all organisations', async () => {
      const mockResponse = { data: [{ id: 1, name: 'Org 1' }, { id: 2, name: 'Org 2' }] }
      axios.get.mockResolvedValue(mockResponse)

      const result = await OrganisationService.getAllOrganisations()

      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/organisations?'))
      expect(result).toEqual(mockResponse.data)
    })

    it('should get all organisations with filters', async () => {
      const mockResponse = { data: [{ id: 1, name: 'Active Org' }] }
      axios.get.mockResolvedValue(mockResponse)

      const result = await OrganisationService.getAllOrganisations({ isActive: true })

      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('isActive=true'))
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle get all organisations error', async () => {
      const mockError = { response: { data: { error: 'Server error' } } }
      axios.get.mockRejectedValue(mockError)

      await expect(OrganisationService.getAllOrganisations()).rejects.toEqual({ error: 'Server error' })
    })

    it('should get organisation by id', async () => {
      const mockResponse = { data: { id: 1, name: 'Test Org', description: 'Test Description' } }
      axios.get.mockResolvedValue(mockResponse)

      const result = await OrganisationService.getOrganisationById(1)

      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/organisations/1'))
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle get organisation by id error', async () => {
      const mockError = { response: { data: { error: 'Organisation not found' } } }
      axios.get.mockRejectedValue(mockError)

      await expect(OrganisationService.getOrganisationById(999)).rejects.toEqual({ error: 'Organisation not found' })
    })

    it('should get my organisations', async () => {
      const mockResponse = { data: [{ id: 1, name: 'My Org', role: 'owner' }] }
      axios.get.mockResolvedValue(mockResponse)

      const result = await OrganisationService.getMyOrganisations()

      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/organisations/myOrganisations'))
      expect(result).toEqual(mockResponse.data)
    })

    it('should create organisation without file', async () => {
      const mockResponse = { data: { id: 2, name: 'New Org' } }
      axios.post.mockResolvedValue(mockResponse)

      const orgData = {
        name: 'New Org',
        description: 'Description',
        email: 'org@example.com',
        phone: '0123456789',
        address: '1 rue de la Paix'
      }

      const result = await OrganisationService.createOrganisation(orgData)

      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/organisations/create'), orgData)
      expect(result).toEqual(mockResponse.data)
    })

    it('should create organisation with file', async () => {
      const mockResponse = { data: { id: 2, name: 'New Org' } }
      axios.post.mockResolvedValue(mockResponse)

      const mockFile = new File(['logo'], 'logo.png', { type: 'image/png' })
      const orgData = {
        name: 'New Org',
        description: 'Description',
        email: 'org@example.com',
        phone: '0123456789',
        address: '1 rue de la Paix',
        logo: mockFile
      }

      const result = await OrganisationService.createOrganisation(orgData)

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/organisations/create'),
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle create organisation error', async () => {
      const mockError = { response: { data: { error: 'Validation failed' } } }
      axios.post.mockRejectedValue(mockError)

      await expect(OrganisationService.createOrganisation({})).rejects.toEqual({ error: 'Validation failed' })
    })

    it('should update organisation', async () => {
      const mockResponse = { data: { id: 1, name: 'Updated Org' } }
      axios.put.mockResolvedValue(mockResponse)

      const updateData = { name: 'Updated Org', description: 'Updated Description' }
      const result = await OrganisationService.updateOrganisation(1, updateData)

      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/organisations/update/1'),
        updateData
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle update organisation error', async () => {
      const mockError = { response: { data: { error: 'Not authorized' } } }
      axios.put.mockRejectedValue(mockError)

      await expect(OrganisationService.updateOrganisation(1, {})).rejects.toEqual({ error: 'Not authorized' })
    })

    it('should delete organisation', async () => {
      const mockResponse = { data: { success: true, message: 'Organisation deleted' } }
      axios.delete.mockResolvedValue(mockResponse)

      const result = await OrganisationService.deleteOrganisation(1)

      expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/organisations/1'))
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle delete organisation error', async () => {
      const mockError = { response: { data: { error: 'Cannot delete organisation' } } }
      axios.delete.mockRejectedValue(mockError)

      await expect(OrganisationService.deleteOrganisation(1)).rejects.toEqual({ error: 'Cannot delete organisation' })
    })

    it('should join organisation', async () => {
      const mockResponse = { data: { success: true, message: 'Joined organisation' } }
      axios.post.mockResolvedValue(mockResponse)

      const result = await OrganisationService.joinOrganisation(1)

      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/organisations/join/1'))
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle join organisation error', async () => {
      const mockError = { response: { data: { error: 'Already a member' } } }
      axios.post.mockRejectedValue(mockError)

      await expect(OrganisationService.joinOrganisation(1)).rejects.toEqual({ error: 'Already a member' })
    })

    it('should leave organisation', async () => {
      const mockResponse = { data: { success: true, message: 'Left organisation' } }
      axios.post.mockResolvedValue(mockResponse)

      const result = await OrganisationService.leaveOrganisation(1)

      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/organisations/leave/1'))
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle leave organisation error', async () => {
      const mockError = { response: { data: { error: 'Not a member' } } }
      axios.post.mockRejectedValue(mockError)

      await expect(OrganisationService.leaveOrganisation(1)).rejects.toEqual({ error: 'Not a member' })
    })

    it('should get organisation members', async () => {
      const mockResponse = { 
        data: { 
          members: [
            { id: 1, name: 'User 1', role: 'owner' },
            { id: 2, name: 'User 2', role: 'member' }
          ] 
        } 
      }
      axios.get.mockResolvedValue(mockResponse)

      const result = await OrganisationService.getOrganisationMembers(1)

      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/organisations/1/members'))
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle get organisation members error', async () => {
      const mockError = { response: { data: { error: 'Access denied' } } }
      axios.get.mockRejectedValue(mockError)

      await expect(OrganisationService.getOrganisationMembers(1)).rejects.toEqual({ error: 'Access denied' })
    })

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network Error')
      axios.get.mockRejectedValue(networkError)

      await expect(OrganisationService.getAllOrganisations()).rejects.toEqual(networkError)
    })

    it('should handle errors without response data', async () => {
      const errorWithoutResponse = new Error('Something went wrong')
      axios.post.mockRejectedValue(errorWithoutResponse)

      await expect(OrganisationService.createOrganisation({})).rejects.toEqual(errorWithoutResponse)
    })
  })
})
