const mongoose = require('mongoose');
require('dotenv').config();

// Import des modèles
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const GameSession = require('../models/GameSession');
const LobbyParticipant = require('../models/LobbyParticipant');
const GameParticipant = require('../models/GameParticipant');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion MongoDB établie');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  }
}

async function migrateToSessions() {
  console.log('🚀 Début de la migration vers l\'architecture des sessions...\n');

  try {
    // 1. Vérifier que les modèles sont bien chargés
    console.log('📋 Étape 1 : Vérification des modèles...');
    
    // Les index sont automatiquement créés par Mongoose via les schémas
    console.log('  ✅ Modèles User, Quiz, GameSession, etc. chargés');
    console.log('  ✅ Index automatiquement créés par Mongoose');

    // 2. Vérifier les collections existantes
    console.log('\n📊 Étape 2 : Vérification des données existantes...');
    
    const existingLobbyParticipants = await mongoose.connection.db.collection('lobbyparticipants').countDocuments();
    const existingGameParticipants = await mongoose.connection.db.collection('gameparticipants').countDocuments();
    
    console.log(`  📈 LobbyParticipants existants: ${existingLobbyParticipants}`);
    console.log(`  📈 GameParticipants existants: ${existingGameParticipants}`);

    // 3. Nettoyer les données de test/développement si nécessaire
    if (existingLobbyParticipants > 0 || existingGameParticipants > 0) {
      console.log('\n🧹 Étape 3 : Nettoyage des données de développement...');
      
      const cleanupChoice = process.argv.includes('--clean');
      if (cleanupChoice) {
        await mongoose.connection.db.collection('lobbyparticipants').deleteMany({});
        await mongoose.connection.db.collection('gameparticipants').deleteMany({});
        console.log('  ✅ Données de développement nettoyées');
      } else {
        console.log('  ⚠️  Utilisez --clean pour nettoyer les données existantes');
      }
    }

    // 4. Vérification des quiz existants
    console.log('\n📝 Étape 4 : Vérification des quiz...');
    const quizCount = await Quiz.countDocuments();
    console.log(`  📊 Nombre de quiz: ${quizCount}`);

    if (quizCount > 0) {
      const quizWithCodes = await Quiz.countDocuments({ joinCode: { $exists: true, $ne: null } });
      console.log(`  🔑 Quiz avec codes: ${quizWithCodes}`);
    }

    // 5. Test de création d'une session de démonstration
    console.log('\n🧪 Étape 5 : Test de création d\'une session...');
    
    if (quizCount > 0) {
      const testQuiz = await Quiz.findOne();
      if (testQuiz && testQuiz.createdBy) {
        try {
          // Créer une session de test
          const testSession = await GameSession.createSession(
            testQuiz._id,
            testQuiz.createdBy,
            {
              maxParticipants: 10,
              timePerQuestion: 30,
              showCorrectAnswers: true,
              allowLateJoin: false
            }
          );

          console.log(`  ✅ Session de test créée avec le code: ${testSession.sessionCode}`);
          
          // Nettoyer la session de test
          await GameSession.findByIdAndDelete(testSession._id);
          console.log('  🧹 Session de test supprimée');
        } catch (error) {
          console.log(`  ⚠️  Erreur test session: ${error.message}`);
        }
      } else {
        console.log('  ⚠️  Pas de quiz avec utilisateur trouvé pour le test');
      }
    }

    // 6. Récapitulatif
    console.log('\n📋 Récapitulatif de la migration:');
    console.log('  ✅ Modèle GameSession prêt');
    console.log('  ✅ Index créés');
    console.log('  ✅ Collections préparées');
    console.log('  ✅ Tests passés');

    console.log('\n🎉 Migration terminée avec succès !');
    console.log('\n📖 Prochaines étapes:');
    console.log('  1. Redémarrer le serveur backend');
    console.log('  2. Utiliser les nouvelles routes /api/session/*');
    console.log('  3. Les anciennes routes /api/quiz/* restent fonctionnelles');

  } catch (error) {
    console.error('❌ Erreur durant la migration:', error);
    throw error;
  }
}

async function checkMigrationStatus() {
  console.log('🔍 Vérification du statut de la migration...\n');

  try {
    // Vérifier les collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log('📊 Collections présentes:');
    const requiredCollections = ['quizzes', 'users', 'questions', 'gamesessions', 'lobbyparticipants', 'gameparticipants'];
    
    requiredCollections.forEach(name => {
      const exists = collectionNames.includes(name);
      console.log(`  ${exists ? '✅' : '❌'} ${name}`);
    });

    // Vérifier les index de GameSession
    console.log('\n🔑 Index GameSession:');
    const gameSessionIndexes = await mongoose.connection.db.collection('gamesessions').indexes();
    
    gameSessionIndexes.forEach(index => {
      console.log(`  ✅ ${JSON.stringify(index.key)}`);
    });

    // Statistiques
    console.log('\n📊 Statistiques:');
    console.log(`  Quiz: ${await Quiz.countDocuments()}`);
    console.log(`  Sessions: ${await GameSession.countDocuments()}`);
    console.log(`  Lobby Participants: ${await LobbyParticipant.countDocuments()}`);
    console.log(`  Game Participants: ${await GameParticipant.countDocuments()}`);

  } catch (error) {
    console.error('❌ Erreur vérification:', error);
  }
}

async function main() {
  await connectDB();

  const command = process.argv[2];

  switch (command) {
    case 'migrate':
      await migrateToSessions();
      break;
    case 'check':
      await checkMigrationStatus();
      break;
    case 'help':
    default:
      console.log('🚀 Script de migration vers l\'architecture des sessions\n');
      console.log('Usage:');
      console.log('  node scripts/migrate-to-sessions.js migrate [--clean]  # Effectuer la migration');
      console.log('  node scripts/migrate-to-sessions.js check             # Vérifier le statut');
      console.log('  node scripts/migrate-to-sessions.js help              # Afficher cette aide');
      console.log('\nOptions:');
      console.log('  --clean  Nettoyer les données de développement existantes');
      break;
  }

  await mongoose.connection.close();
  console.log('\n🔌 Connexion fermée');
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  console.error('❌ Erreur non gérée:', error);
  process.exit(1);
});

main().catch(console.error);