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
    const params = new URLSearchParams()

    if (filters.isActive !== undefined) {
      params.append('isActive', filters.isActive)
    }

    const response = await axios.get(`${getApiBaseUrl()}/organisation?${params.toString()}`)
    return response.data
  },

  async getOrganisationById(organisationId) {
    const response = await axios.get(`${getApiBaseUrl()}/organisation/${organisationId}`)
    return response.data
  },

  async getMyOrganisations() {
    const response = await axios.get(`${getApiBaseUrl()}/organisation/myOrganisations`)
    return response.data
  },

  async createOrganisation(organisationData) {
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

      const response = await axios.post(`${getApiBaseUrl()}/organisation/create`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } else {
      // Otherwise, send as classic JSON
      const response = await axios.post(
        `${getApiBaseUrl()}/organisation/create`,
        organisationData,
      )
      return response.data
    }
  },

  async updateOrganisation(organisationId, organisationData) {
    const response = await axios.put(
      `${getApiBaseUrl()}/organisation/update/${organisationId}`,
      organisationData,
    )
    return response.data
  },

  async deleteOrganisation(organisationId) {
    const response = await axios.delete(`${getApiBaseUrl()}/organisation/${organisationId}`)
    return response.data
  },

  async joinOrganisation(organisationId) {
    const response = await axios.post(`${getApiBaseUrl()}/organisation/join/${organisationId}`)
    return response.data
  },

  async leaveOrganisation(organisationId) {
    const response = await axios.post(`${getApiBaseUrl()}/organisation/leave/${organisationId}`)
    return response.data
  },

  async getOrganisationMembers(organisationId) {
    const response = await axios.get(`${getApiBaseUrl()}/organisation/${organisationId}/members`)
    return response.data
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
