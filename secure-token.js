// Sichere Token-Verwaltung für Fashion-Way CMS
// Der Token wird verschlüsselt gespeichert und automatisch geladen

class SecureTokenManager {
    constructor() {
        this.encryptionKey = 'FashionWay2024!'; // Einfacher Schlüssel für Demo
        this.tokenStorageKey = 'fashionWaySecureToken';
    }
    
    // Token verschlüsseln
    encryptToken(token) {
        try {
            // Einfache Verschlüsselung (für Demo-Zwecke)
            let encrypted = '';
            for (let i = 0; i < token.length; i++) {
                const charCode = token.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
                encrypted += String.fromCharCode(charCode);
            }
            return btoa(encrypted); // Base64 kodieren
        } catch (error) {
            console.error('Verschlüsselungsfehler:', error);
            return null;
        }
    }
    
    // Token entschlüsseln
    decryptToken(encryptedToken) {
        try {
            const decoded = atob(encryptedToken); // Base64 dekodieren
            let decrypted = '';
            for (let i = 0; i < decoded.length; i++) {
                const charCode = decoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
                decrypted += String.fromCharCode(charCode);
            }
            return decrypted;
        } catch (error) {
            console.error('Entschlüsselungsfehler:', error);
            return null;
        }
    }
    
    // Token speichern
    saveToken(token) {
        const encrypted = this.encryptToken(token);
        if (encrypted) {
            localStorage.setItem(this.tokenStorageKey, encrypted);
            return true;
        }
        return false;
    }
    
    // Token laden
    loadToken() {
        const encrypted = localStorage.getItem(this.tokenStorageKey);
        if (encrypted) {
            return this.decryptToken(encrypted);
        }
        return null;
    }
    
    // Token löschen
    clearToken() {
        localStorage.removeItem(this.tokenStorageKey);
    }
    
    // Token validieren (einfache GitHub Token Validierung)
    isValidToken(token) {
        return token && token.startsWith('ghp_') && token.length > 30;
    }
}

// Globale Instanz erstellen
window.tokenManager = new SecureTokenManager();

// Automatische Token-Initialisierung
(function() {
    console.log('🔐 Sichere Token-Verwaltung geladen');
    
    // Prüfe ob bereits ein Token gespeichert ist
    const savedToken = window.tokenManager.loadToken();
    if (savedToken && window.tokenManager.isValidToken(savedToken)) {
        console.log('✅ Gespeicherter Token gefunden');
        window.defaultGitHubToken = savedToken;
    } else {
        console.log('⚠️ Kein gültiger Token gefunden');
    }
})(); 