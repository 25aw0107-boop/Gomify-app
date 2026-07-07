export const kawaiItemma = { 
    colors: { 
        background: "FDF8F5",
        text: "6B4E3C",
    },
    images: {
        homeicon: require('@/assets/images/kawaiibackground.png'),
        profileicon: require('@/assets/images/kawaiibackground.png'),
        settingsicon: require('@/assets/images/kawaiibackground.png'),
          kawaiiBackground: require('@/assets/images/kawaiibackground.png'),
          dashboardHero: require('@/assets/images/kawaiibackground.png'),
    },
    fonts: {
        title: "'Poppins', sans-serif",
        subtitle: "'Poppins', sans-serif",
        body: "'Poppins', sans-serif",
        button: "'Poppins', sans-serif",
        input: "'Poppins', sans-serif",
        label: "'Poppins', sans-serif",
        text: "'Poppins', sans-serif",
    },

    
    fontSizes: {
        title: 40,
        subtitle: 30,
        body: 20,
        button: 20,
        input: 20,
        label: 20,
        text: 20,
    },
    fontWeights: {
        title: 700,
        subtitle: 700,
        body: 700,
        button: 700,
        input: 700,
        label: 700,
        text: 700,
    },
    lineHeights: {
        title: 1.2,
        subtitle: 1.2,
        body: 1.2,
        button: 1.2,
        input: 1.2,
        label: 1.2,
        text: 1.2,
    },
    spacing: {
        small: 8,
        medium: 16,
        large: 24,
        xlarge: 32,
    },
    borderRadius: {
        small: 4,
        medium: 8,
        large: 12,
        xlarge: 16,
    } 
}; 

// app/tema/kawaiitema.ts

export const appThemes = {
  natural: {
    colors: { background: '#F5F5F5', cardBg: '#FFFFFF', text: '#333333', primary: '#5B9E00' },
    images: {
      homeIcon: require('@/assets/images/kawaiibackground.png'), // Byt ut till rätt bildsökvägar
      profileIcon: require('@/assets/images/kawaiibackground.png'),
    }
  },
night: {
    colors: { 
      background: '#1C2432', // 🌌 Din önskade mörka basfärg
      cardBg: '#253246',     // En aning ljusare blågrå för dina kort/boxar så de syns
      text: '#A6C56F',       // 🟢 Din önskade ljusgröna textfärg för rubriker
      primary: '#A6C56F'     // Ljusgrön även för aktiva ikoner
    },
    images: {
      homeIcon: require('@/assets/images/midnightbackground.png'), 
      profileIcon: require('@/assets/images/midnightbackground.png'),
    }
  },
  cute: { // Detta är ditt Kawaii-tema!
    colors: { background: '#FDF8F5', cardBg: '#FFFFFF', text: '#6B4E3C', primary: '#ffdde2' },
    images: {
      homeIcon: require('@/assets/images/kawaiibackground.png'), 
      profileIcon: require('@/assets/images/kawaiibackground.png'),
          kawaiiBackground: require('@/assets/images/kawaiibackground.png'),
          dashboardHero: require('@/assets/images/kawaiibackground.png'),
    }
  },
  cafe: {
    colors: { background: '#F4EBE1', cardBg: '#FFFFFF', text: '#4A3B32', primary: '#A67B5B' },
    images: {
      homeIcon: require('@/assets/images/kawaiibackground.png'), 
      profileIcon: require('@/assets/images/kawaiibackground.png'),
    }
  }
};