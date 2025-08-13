const Organisation = require('../models/Organisation');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const { compressImage } = require('../middlewares/imageCompression');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/logos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
}).single('logo');

// CREATE ORGANISATION
exports.createOrganisation = async (req, res, next) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          status: 'error',
          message: err.message
        });
      }

      if (req.file) {
        await compressImage(req, res, () => {});
      }

      const { name, description } = req.body;
      const userId = req.user._id;

      if (!name || name.trim() === '') {
        return res.status(400).json({
          status: 'error',
          message: 'Le nom de l\'organisation est requis'
        });
      }

      const existingOrg = await Organisation.findOne({ 
        name: name.trim(),
        createdBy: userId
      });

      if (existingOrg) {
        return res.status(400).json({
          status: 'error',
          message: 'Vous avez déjà une organisation avec ce nom'
        });
      }

      const organisationData = {
        name: name.trim(),
        description: description || '',
        createdBy: userId,
        ownerId: userId,
        members: [userId]
      };

      if (req.file) {
        organisationData.logoUrl = req.file.filename;
      }

      const organisation = await Organisation.create(organisationData);

      await organisation.populate('createdBy', 'userName email avatar');
      await organisation.populate('members', 'userName email avatar');

      res.status(201).json({
        status: 'success',
        message: 'Organisation créée avec succès',
        data: {
          organisation
        }
      });
    });
  } catch (error) {
    console.error('Erreur création organisation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur serveur lors de la création de l\'organisation'
    });
  }
};

// GET ALL ORGANISATIONS
exports.getOrganisations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const organisations = await Organisation
      .find()
      .populate('createdBy', 'userName email avatar')
      .populate('members', 'userName email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Organisation.countDocuments();

    res.status(200).json({
      status: 'success',
      results: organisations.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: {
        organisations
      }
    });
  } catch (error) {
    console.error('Erreur récupération organisations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur serveur lors de la récupération des organisations'
    });
  }
};

// GET ORGANISATION BY ID
exports.getOrganisationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const organisation = await Organisation
      .findById(id)
      .populate('createdBy', 'userName email avatar')
      .populate('members', 'userName email avatar');

    if (!organisation) {
      return res.status(404).json({
        status: 'error',
        message: 'Organisation non trouvée'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        organisation
      }
    });
  } catch (error) {
    console.error('Erreur récupération organisation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur serveur lors de la récupération de l\'organisation'
    });
  }
};

// GET MY ORGANISATIONS
exports.getMyOrganisations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const createdOrganisations = await Organisation
      .find({ createdBy: userId })
      .populate('createdBy', 'userName email avatar')
      .populate('members', 'userName email avatar')
      .sort({ createdAt: -1 });

    const memberOrganisations = await Organisation
      .find({ 
        members: userId,
        createdBy: { $ne: userId }
      })
      .populate('createdBy', 'userName email avatar')
      .populate('members', 'userName email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        createdOrganisations,
        memberOrganisations,
        totalCreated: createdOrganisations.length,
        totalMember: memberOrganisations.length
      }
    });
  } catch (error) {
    console.error('Erreur récupération mes organisations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur serveur lors de la récupération de vos organisations'
    });
  }
};

// UPDATE ORGANISATION
exports.updateOrganisation = async (req, res, next) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          status: 'error',
          message: err.message
        });
      }

      if (req.file) {
        await compressImage(req, res, () => {});
      }

      const { id } = req.params;
      const { name, description } = req.body;
      const userId = req.user._id;

      const organisation = await Organisation.findById(id);

      if (!organisation) {
        return res.status(404).json({
          status: 'error',
          message: 'Organisation non trouvée'
        });
      }

      if (organisation.ownerId.toString() !== userId.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Vous n\'avez pas les droits pour modifier cette organisation'
        });
      }

      const updateData = {};
      if (name && name.trim() !== '') updateData.name = name.trim();
      if (description !== undefined) updateData.description = description;
      if (req.file) updateData.logoUrl = req.file.filename;

      const updatedOrganisation = await Organisation
        .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .populate('createdBy', 'userName email avatar')
        .populate('members', 'userName email avatar');

      res.status(200).json({
        status: 'success',
        message: 'Organisation mise à jour avec succès',
        data: {
          organisation: updatedOrganisation
        }
      });
    });
  } catch (error) {
    console.error('Erreur mise à jour organisation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur serveur lors de la mise à jour de l\'organisation'
    });
  }
};

// ADD MEMBERS TO ORGANISATION
exports.addMembersToOrganisation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { memberIds } = req.body;
    const userId = req.user._id;

    const organisation = await Organisation.findById(id);

    if (!organisation) {
      return res.status(404).json({
        status: 'error',
        message: 'Organisation non trouvée'
      });
    }

    if (organisation.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'avez pas les droits pour ajouter des membres'
      });
    }

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Veuillez fournir une liste d\'utilisateurs à ajouter'
      });
    }

    const users = await User.find({ _id: { $in: memberIds } });
    
    if (users.length !== memberIds.length) {
      return res.status(400).json({
        status: 'error',
        message: 'Certains utilisateurs n\'existent pas'
      });
    }

    const newMembers = memberIds.filter(memberId => 
      !organisation.members.includes(memberId)
    );

    if (newMembers.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Tous les utilisateurs sont déjà membres de l\'organisation'
      });
    }

    organisation.members.push(...newMembers);
    await organisation.save();

    await organisation.populate('members', 'userName email avatar');

    res.status(200).json({
      status: 'success',
      message: `${newMembers.length} membre(s) ajouté(s) avec succès`,
      data: {
        organisation
      }
    });
  } catch (error) {
    console.error('Erreur ajout membres:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur serveur lors de l\'ajout des membres'
    });
  }
};

// REMOVE MEMBERS FROM ORGANISATION
exports.removeMembersFromOrganisation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { memberIds } = req.body; 
    const userId = req.user._id;

    const organisation = await Organisation.findById(id);

    if (!organisation) {
      return res.status(404).json({
        status: 'error',
        message: 'Organisation non trouvée'
      });
    }

    if (organisation.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'avez pas les droits pour retirer des membres'
      });
    }

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Veuillez fournir une liste d\'utilisateurs à retirer'
      });
    }

    if (memberIds.includes(userId.toString())) {
      return res.status(400).json({
        status: 'error',
        message: 'Le propriétaire ne peut pas être retiré de l\'organisation'
      });
    }

    organisation.members = organisation.members.filter(
      memberId => !memberIds.includes(memberId.toString())
    );

    await organisation.save();
    await organisation.populate('members', 'userName email avatar');

    res.status(200).json({
      status: 'success',
      message: 'Membre(s) retiré(s) avec succès',
      data: {
        organisation
      }
    });
  } catch (error) {
    console.error('Erreur retrait membres:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur serveur lors du retrait des membres'
    });
  }
};

// DELETE ORGANISATION
exports.deleteOrganisation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const organisation = await Organisation.findById(id);

    if (!organisation) {
      return res.status(404).json({
        status: 'error',
        message: 'Organisation non trouvée'
      });
    }

    if (organisation.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'avez pas les droits pour supprimer cette organisation'
      });
    }

    await Organisation.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Organisation supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression organisation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur serveur lors de la suppression de l\'organisation'
    });
  }
};
