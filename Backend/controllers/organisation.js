const Organisation = require('../models/Organisation')

// Create a new organisation
exports.createOrganisation = async (req, res) => {
  try {
    const { name, description, logoUrl } = req.body
    const userId = req.user._id

    const organisation = new Organisation({
      name,
      description,
      logoUrl,
      createdBy: userId,
      ownerId: userId,
      members: [userId]
    })
    await organisation.save()
    res.status(201).json(organisation)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

// Get all organisations
exports.getOrganisations = async (req, res) => {
  try {
    const organisations = await Organisation.find().populate('createdBy ownerId members', 'username email')
    res.json(organisations)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get a single organisation by ID
exports.getOrganisationById = async (req, res) => {
  try {
    const organisation = await Organisation.findById(req.params.id).populate('createdBy ownerId members', 'username email')
    if (!organisation) return res.status(404).json({ error: 'Organisation not found' })
    res.json(organisation)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Update an organisation
exports.updateOrganisation = async (req, res) => {
  try {
    const { name, description, logoUrl } = req.body
    const organisation = await Organisation.findByIdAndUpdate(
      req.params.id,
      { name, description, logoUrl },
      { new: true, runValidators: true }
    )
    if (!organisation) return res.status(404).json({ error: 'Organisation not found' })
    res.json(organisation)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

// Delete an organisation
exports.deleteOrganisation = async (req, res) => {
  try {
    const organisation = await Organisation.findByIdAndDelete(req.params.id)
    if (!organisation) return res.status(404).json({ error: 'Organisation not found' })
    res.json({ message: 'Organisation deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Add a member to an organisation
exports.addMember = async (req, res) => {
  try {
    const { userId } = req.body
    const organisation = await Organisation.findById(req.params.id)
    if (!organisation) return res.status(404).json({ error: 'Organisation not found' })
    if (!organisation.members.includes(userId)) {
      organisation.members.push(userId)
      await organisation.save()
    }
    res.json(organisation)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

// Remove a member from an organisation
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.body
    const organisation = await Organisation.findById(req.params.id)
    if (!organisation) return res.status(404).json({ error: 'Organisation not found' })
    organisation.members = organisation.members.filter(
      memberId => memberId.toString() !== userId
    )
    await organisation.save()
    res.json(organisation)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}
