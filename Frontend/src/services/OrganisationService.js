import axios from 'axios'

// Dynamic URL based on environment
const getApiBaseUrl = () => {
  // Utilise la variable d'environnement ou l'URL de production
  const apiUrl = import.meta.env.VITE_API_URL || 'https://quizzfiesta.onrender.com'
  
  // Fallback pour le développement local
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:3000/api'
  }
  
  return `${apiUrl}/api`
}

class OrganisationService {
  constructor() {
    this.api = axios.create({
      baseURL: getApiBaseUrl(),
    })
    // Note: Authentication is handled globally by AuthService
  }

  async getAllOrganisations(filters = {}) {
    try {
      const params = new URLSearchParams()

      if (filters.isActive !== undefined) {
        params.append('isActive', filters.isActive)
      }

      const response = await this.api.get(`/organisations?${params.toString()}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async getOrganisationById(organisationId) {
    try {
      const response = await this.api.get(`/organisations/${organisationId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async getMyOrganisations() {
    try {
      const response = await this.api.get('/organisations/myOrganisations')
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

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

        const response = await this.api.post('/organisations/create', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        return response.data
      } else {
        // Otherwise, send as classic JSON
        const response = await this.api.post('/organisations/create', organisationData)
        return response.data
      }
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async updateOrganisation(organisationId, organisationData) {
    try {
      const response = await this.api.put(`/organisations/update/${organisationId}`, organisationData)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async deleteOrganisation(organisationId) {
    try {
      const response = await this.api.delete(`/organisations/${organisationId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async joinOrganisation(organisationId) {
    try {
      const response = await this.api.post(`/organisations/join/${organisationId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async leaveOrganisation(organisationId) {
    try {
      const response = await this.api.post(`/organisations/leave/${organisationId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async getOrganisationMembers(organisationId) {
    try {
      const response = await this.api.get(`/organisations/${organisationId}/members`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
}

const organisationServiceInstance = new OrganisationService()

export default organisationServiceInstance
