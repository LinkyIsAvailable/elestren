async function loadLeaderboard() {
    try {
        const response = await fetch('levels.json');
        const data = await response.json();
        // ...existing code...
    } catch (error) {
        console.error('Erreur:', error);
    }
}

function calculateLevel(xp) {
    const BASE_XP = 100;
    const MULTIPLIER = 1.22;
    let level = 1;
    let totalXp = 0;
    
    while (true) {
        let xpNeeded = Math.floor(BASE_XP * Math.pow(MULTIPLIER, level - 1));
        if (totalXp + xpNeeded > xp) {
            return level - 1;
        }
        totalXp += xpNeeded;
        level++;
    }
}

function calculateLevelProgress(xp) {
    const BASE_XP = 100;
    const MULTIPLIER = 1.22;
    let level = 1;
    let totalXpForCurrentLevel = 0;
    
    while (true) {
        let xpNeeded = Math.floor(BASE_XP * Math.pow(MULTIPLIER, level - 1));
        if (totalXpForCurrentLevel + xpNeeded > xp) {
            return {
                currentLevelXp: xp - totalXpForCurrentLevel,
                neededXp: xpNeeded,
                percentage: Math.floor(((xp - totalXpForCurrentLevel) / xpNeeded) * 100)
            };
        }
        totalXpForCurrentLevel += xpNeeded;
        level++;
    }
}

async function loadLeaderboard() {
    const leaderboardContent = document.getElementById('leaderboard-content');
    leaderboardContent.innerHTML = '<div class="loading">Chargement du classement...</div>';

    try {
        console.log("Tentative de connexion au serveur...");
        const response = await fetch('http://localhost:8000/levels.json');
        console.log("Statut de la réponse:", response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur serveur (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        console.log("Données reçues:", data);

        // Vérifier si le fichier est vide ou invalide
        if (!data || Object.keys(data).length === 0) {
            leaderboardContent.innerHTML = '<div class="error">Aucune donnée de classement disponible</div>';
            return;
        }

        // Convertir l'objet en tableau et trier par XP
        const sortedUsers = Object.entries(data)
            .filter(([_, userData]) => !userData.hidden)
            .sort((a, b) => b[1].xp - a[1].xp);

        // Afficher un message si aucun utilisateur n'est trouvé après filtrage
        if (sortedUsers.length === 0) {
            leaderboardContent.innerHTML = '<div class="error">Aucun utilisateur classé pour le moment</div>';
            return;
        }

        leaderboardContent.innerHTML = '';

        sortedUsers.forEach(([userId, userData], index) => {
            const level = calculateLevel(userData.xp);
            const progress = calculateLevelProgress(userData.xp);
            const row = document.createElement('div');
            row.className = `leaderboard-row ${index < 3 ? 'rank-' + (index + 1) : ''}`;
            
            row.innerHTML = `
                <span>${index + 1}</span>
                <span>
                    <div class="user-avatar-container">
                        <img src="${userData.avatar}" alt="Avatar" class="user-avatar">
                        ${index === 0 ? '<span class="crown">👑</span>' : ''}
                    </div>
                    ${userData.username || 'Utilisateur ' + userId}
                </span>
                <span class="level-column">
                    <div class="level-info">
                        <span class="level-number">Niveau ${level}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                        <div class="progress-text">${progress.currentLevelXp}/${progress.neededXp}</div>
                    </div>
                </span>
                <span class="xp-total">${userData.xp}</span>
            `;
            
            leaderboardContent.appendChild(row);
        });
    } catch (error) {
        console.error('Erreur détaillée:', error);
        leaderboardContent.innerHTML = `<div class="error">
                Erreur de chargement du classement:<br>
                ${error.message}<br><br>
                Vérifiez que:<br>
                1. Le serveur est démarré (python server.py)<br>
                2. Le token Discord est configuré dans config.json<br>
                3. Le fichier levels.json existe
            </div>`;
    }
}

// Charger le classement au démarrage
document.addEventListener('DOMContentLoaded', loadLeaderboard);
