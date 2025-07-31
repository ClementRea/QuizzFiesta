#SMART PUSH, POUR DEPLOYER ET PUSH SUR LES DEUX REPOS GITHUB

current_branch=$(git branch --show-current)

echo "🔍 Branche actuelle: $current_branch"

if [ "$current_branch" = "develop" ]; then
    echo "🚀 Options pour la branche develop:"
    echo "1) Push develop vers school ET personal"
    echo "2) Push develop uniquement vers school"
    echo "3) Déployer (merge develop → main et push vers personal)"
    echo "4) Push develop vers school/personal ET déployer"
    echo "5) Annuler"
    
    read -p "Votre choix (1-5): " choice
    
    case $choice in
        1)
            echo "📚 Push develop vers school..."
            git push school develop
            if [ $? -eq 0 ]; then
                echo "👤 Push develop vers personal..."
                git push personal develop
            else
                echo "❌ Erreur lors du push vers school"
                exit 1
            fi
            ;;
        2)
            echo "📚 Push develop vers school uniquement..."
            git push school develop
            ;;
        3)
            echo "🚀 Déploiement en cours..."
            echo "📚 Checkout main..."
            git checkout main
            echo "🔄 Merge develop dans main..."
            git merge develop
            if [ $? -eq 0 ]; then
                echo "👤 Push main vers personal (déploiement)..."
                git push personal main
                echo "🔄 Retour sur develop..."
                git checkout develop
            else
                echo "❌ Erreur lors du merge"
                git checkout develop
                exit 1
            fi
            ;;
        4)
            echo "📚 Push develop vers school..."
            git push school develop
            if [ $? -eq 0 ]; then
                echo "👤 Push develop vers personal..."
                git push personal develop
                if [ $? -eq 0 ]; then
                    echo "🚀 Déploiement en cours..."
                    echo "📚 Checkout main..."
                    git checkout main
                    echo "🔄 Merge develop dans main..."
                    git merge develop
                    if [ $? -eq 0 ]; then
                        echo "👤 Push main vers personal (déploiement)..."
                        git push personal main
                        echo "🔄 Retour sur develop..."
                        git checkout develop
                    else
                        echo "❌ Erreur lors du merge"
                        git checkout develop
                        exit 1
                    fi
                else
                    echo "❌ Erreur lors du push develop vers personal"
                    exit 1
                fi
            else
                echo "❌ Erreur lors du push vers school"
                exit 1
            fi
            ;;
        5)
            echo "❌ Push annulé"
            exit 0
            ;;
        *)
            echo "❌ Choix invalide"
            exit 1
            ;;
    esac
else
    echo "🚀 Branche '$current_branch' détectée"
    echo "📚 Push vers school uniquement (règle pour les branches autres que develop)"
    
    read -p "Confirmer le push vers school? (y/N): " confirm
    
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        echo "📚 Push $current_branch vers school..."
        git push school $current_branch
    else
        echo "❌ Push annulé"
        exit 0
    fi
fi

if [ $? -eq 0 ]; then
    echo "✅ Opération terminée avec succès !"
else
    echo "❌ Une erreur s'est produite"
fi