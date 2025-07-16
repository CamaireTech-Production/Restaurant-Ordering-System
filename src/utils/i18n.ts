const translations: Record<string, Record<string, string>> = {
  en: {
    'restaurant_management': 'Restaurant Management',
    'menu_link': 'Menu Link',
    'order_link': 'Order Link',
    'dashboard': 'Dashboard',
    'dishes': 'Dishes',
    'categories': 'Categories',
    'tables': 'Tables',
    'orders': 'Orders',
    'settings': 'Settings',
    'profile': 'Profile',
    'online': 'Online',
    'offline': 'Offline',
    'sign_out': 'Sign Out',
    // Add more keys as needed
  },
  fr: {
    'restaurant_management': 'Gestion du restaurant',
    'menu_link': 'Lien du menu',
    'order_link': 'Lien de commande',
    'dashboard': 'Tableau de bord',
    'dishes': 'Plats',
    'categories': 'Catégories',
    'tables': 'Tables',
    'orders': 'Commandes',
    'settings': 'Paramètres',
    'profile': 'Profil',
    'online': 'En ligne',
    'offline': 'Hors ligne',
    'sign_out': 'Déconnexion',
    // Add more keys as needed
  },
};

export function t(key: string, lang: string = 'en'): string {
  return translations[lang]?.[key] || translations['en'][key] || key;
}

export const availableLanguages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
]; 