import axios from 'axios'

// Dynamic URL based on environment
const getApiBaseUrl = () => {
  // Utilise la variable d'environnement ou l'URL de production
  const apiUrl = process.env.VITE_API_URL || 'https://quizzfiesta.onrender.com'

  // Fallback pour le développement local
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000/api'
  }

  return `${apiUrl}/api`
}

const OrganisationService = {
  async getAllOrganisations(filters = {}) {
    try {
      const params = new URLSearchParams()

      if (filters.isActive !== undefined) {
        params.append('isActive', filters.isActive)
      }

      const response = await axios.get(`${getApiBaseUrl()}/organisations?${params.toString()}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  async getOrganisationById(organisationId) {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/organisations/${organisationId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  async getMyOrganisations() {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/organisations/myOrganisations`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  async createOrganisation(organisationData) {
    try {
      // If there's a logo (file), use FormData
      if (organisationData.logo && organisationData.logo instanceof File) {
        const formData = new FormData()

        // Add the logo file
        formData.append('logo', organisationData.logo)

        // Add other organisation data
        formData.append('name', organisationData.name)
        formData.append('description', organisationData.description)
        formData.append('email', organisationData.email)
        formData.append('phone', organisationData.phone)
        formData.append('address', organisationData.address)

        const response = await axios.post(`${getApiBaseUrl()}/organisations/create`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        return response.data
      } else {
        // Otherwise, send as classic JSON
        const response = await axios.post(
          `${getApiBaseUrl()}/organisations/create`,
          organisationData,
        )
        return response.data
      }
    } catch (error) {
      throw error.response?.data || error
    }
  },

  async updateOrganisation(organisationId, organisationData) {
    try {
      const response = await axios.put(
        `${getApiBaseUrl()}/organisations/update/${organisationId}`,
        organisationData,
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  async deleteOrganisation(organisationId) {
    try {
      const response = await axios.delete(`${getApiBaseUrl()}/organisations/${organisationId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  async joinOrganisation(organisationId) {
    try {
      const response = await axios.post(`${getApiBaseUrl()}/organisations/join/${organisationId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  async leaveOrganisation(organisationId) {
    try {
      const response = await axios.post(`${getApiBaseUrl()}/organisations/leave/${organisationId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  async getOrganisationMembers(organisationId) {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/organisations/${organisationId}/members`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Utility functions for tests
  validateOrganisationName(name) {
    return !!(name && name.length >= 3)
  },

  validateOrganisationEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailPattern.test(email)
  },

  filterOrganisationFields(orgData) {
    const allowedFields = ['name', 'description', 'email', 'phone', 'address']
    const filtered = {}
    Object.keys(orgData).forEach((key) => {
      if (allowedFields.includes(key) && orgData[key]) {
        filtered[key] = orgData[key]
      }
    })
    return filtered
  },
}

export default OrganisationService
