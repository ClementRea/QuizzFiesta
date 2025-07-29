describe('Organisation utility functions', () => {
  describe('Organisation data validation', () => {
    const validateOrganisationName = (name) => {
      // Au moins 3 caractères, pas vide
      return !!(name && name.length >= 3)
    }

    const validateOrganisationEmail = (email) => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailPattern.test(email)
    }

    it('should validate correct organisation names', () => {
      expect(validateOrganisationName('My Org')).toBe(true)
      expect(validateOrganisationName('Org123')).toBe(true)
    })

    it('should reject invalid organisation names', () => {
      expect(validateOrganisationName('')).toBe(false)
      expect(validateOrganisationName(null)).toBe(false)
      expect(validateOrganisationName('AB')).toBe(false)
    })

    it('should validate correct organisation emails', () => {
      expect(validateOrganisationEmail('org@example.com')).toBe(true)
      expect(validateOrganisationEmail('contact@asso.fr')).toBe(true)
    })

    it('should reject invalid organisation emails', () => {
      expect(validateOrganisationEmail('invalid-email')).toBe(false)
      expect(validateOrganisationEmail('org@')).toBe(false)
      expect(validateOrganisationEmail('')).toBe(false)
    })
  })

  describe('Form data utilities', () => {
    const filterOrganisationFields = (orgData) => {
      const allowedFields = ['name', 'description', 'email', 'phone', 'address']
      const filtered = {}
      Object.keys(orgData).forEach(key => {
        if (allowedFields.includes(key) && orgData[key]) {
          filtered[key] = orgData[key]
        }
      })
      return filtered
    }

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
      const filtered = filterOrganisationFields(orgData)
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

    it('should handle empty or null values', () => {
      const orgData = {
        name: '',
        description: null,
        email: 'org@example.com',
        phone: '',
        address: '1 rue de la Paix'
      }
      const filtered = filterOrganisationFields(orgData)
      expect(filtered).toEqual({
        email: 'org@example.com',
        address: '1 rue de la Paix'
      })
    })
  })
  })
