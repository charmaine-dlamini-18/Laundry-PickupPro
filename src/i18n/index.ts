import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const LANGUAGE_KEY = 'laundry_pickup_language';

const resources = {
  en: {
    translation: {
      language: 'English',
      selectLanguage: 'Select Language',
      placeNewOrder: 'Place New Order',
      trackOrder: 'Track Order',
      orderHistory: 'Order History',
      notifications: 'Notifications',
      addresses: 'Addresses',
      support: 'Support',
      rateApp: 'Rate the App',
      settings: 'Settings',
      account: 'Account',
      pushNotifications: 'Push notifications',
      orderStatusReminders: 'Order status and reminders',
      emailNotifications: 'Email notifications',
      receiptsConfirmations: 'Receipts and confirmations',
      smsUpdates: 'SMS updates',
      deliveryTimeUpdates: 'Delivery time updates',
      locationServices: 'Location services',
      fasterPickupDropoff: 'Faster pickup & drop-off',
    },
  },

  af: {
    translation: {
      language: 'Afrikaans',
      selectLanguage: 'Kies Taal',
      placeNewOrder: 'Plaas Nuwe Bestelling',
      trackOrder: 'Volg Bestelling',
      orderHistory: 'Bestelgeskiedenis',
      notifications: 'Kennisgewings',
      addresses: 'Adresse',
      support: 'Ondersteuning',
      rateApp: 'Beoordeel die App',
      settings: 'Instellings',
      account: 'Rekening',
      pushNotifications: 'Stootkennisgewings',
      orderStatusReminders: 'Bestelstatus en herinnerings',
      emailNotifications: 'E-poskennisgewings',
      receiptsConfirmations: 'Kwitansies en bevestigings',
      smsUpdates: 'SMS-opdaterings',
      deliveryTimeUpdates: 'Afleweringstyd-opdaterings',
      locationServices: 'Liggingdienste',
      fasterPickupDropoff: 'Vinniger optel en aflaai',
    },
  },

  xh: {
    translation: {
      language: 'isiXhosa',
      selectLanguage: 'Khetha uLwimi',
      placeNewOrder: 'Faka i-odolo eNtsha',
      trackOrder: 'Landela i-odolo',
      orderHistory: 'Imbali yee-odolo',
      notifications: 'Izaziso',
      addresses: 'Iidilesi',
      support: 'Inkxaso',
      rateApp: 'Linganisa i-App',
      settings: 'Iisetingi',
      account: 'Iakhawunti',
      pushNotifications: 'Izaziso zokutyhala',
      orderStatusReminders: 'Imeko ye-odolo nezikhumbuzi',
      emailNotifications: 'Izaziso ze-imeyile',
      receiptsConfirmations: 'Iirisithi neziqinisekiso',
      smsUpdates: 'Uhlaziyo lwe-SMS',
      deliveryTimeUpdates: 'Uhlaziyo lwexesha lokuhanjiswa',
      locationServices: 'Iinkonzo zendawo',
      fasterPickupDropoff: 'Ukuthathwa nokuhanjiswa ngokukhawuleza',
    },
  },

  zu: {
    translation: {
      language: 'isiZulu',
      selectLanguage: 'Khetha Ulimi',
      placeNewOrder: 'Faka i-oda Elisha',
      trackOrder: 'Landelela i-oda',
      orderHistory: 'Umlando Wama-oda',
      notifications: 'Izaziso',
      addresses: 'Amakheli',
      support: 'Usizo',
      rateApp: 'Linganisela Uhlelo',
      settings: 'Izilungiselelo',
      account: 'I-akhawunti',
      pushNotifications: 'Izaziso zokuphusha',
      orderStatusReminders: 'Isimo se-oda nezikhumbuzi',
      emailNotifications: 'Izaziso ze-imeyili',
      receiptsConfirmations: 'Amarisidi neziqinisekiso',
      smsUpdates: 'Izibuyekezo ze-SMS',
      deliveryTimeUpdates: 'Izibuyekezo zesikhathi sokulethwa',
      locationServices: 'Izinsizakalo zendawo',
      fasterPickupDropoff: 'Ukuthathwa nokulethwa okusheshayo',
    },
  },

  nso: {
    translation: {
      language: 'Sepedi',
      selectLanguage: 'Kgetha Leleme',
      placeNewOrder: 'Bea Otara ye Mpsha',
      trackOrder: 'Latela Otara',
      orderHistory: 'Histori ya Diotara',
      notifications: 'Ditsebišo',
      addresses: 'Diaterese',
      support: 'Thekgo',
      rateApp: 'Lekola App',
      settings: 'Dipeakanyo',
      account: 'Akhaonto',
      pushNotifications: 'Ditsebišo tša push',
      orderStatusReminders: 'Maemo a otara le dikgopotšo',
      emailNotifications: 'Ditsebišo tša imeile',
      receiptsConfirmations: 'Dirisiti le ditiišetšo',
      smsUpdates: 'Dintlafatšo tša SMS',
      deliveryTimeUpdates: 'Dintlafatšo tša nako ya thomelo',
      locationServices: 'Ditirelo tša lefelo',
      fasterPickupDropoff: 'Go tšewa le go romelwa ka pela',
    },
  },

  st: {
    translation: {
      language: 'Sesotho',
      selectLanguage: 'Kgetha Puo',
      placeNewOrder: 'Beha Odara e Ntjha',
      trackOrder: 'Latela Odara',
      orderHistory: 'Nalane ya Di-odara',
      notifications: 'Ditsebiso',
      addresses: 'Diaterese',
      support: 'Tshehetso',
      rateApp: 'Lekanya App',
      settings: 'Dipeakanyo',
      account: 'Akhaonto',
      pushNotifications: 'Ditsebiso tsa push',
      orderStatusReminders: 'Boemo ba odara le dikgopotso',
      emailNotifications: 'Ditsebiso tsa imeile',
      receiptsConfirmations: 'Dirisiti le netefatso',
      smsUpdates: 'Dintlafatso tsa SMS',
      deliveryTimeUpdates: 'Dintlafatso tsa nako ya phano',
      locationServices: 'Ditshebeletso tsa sebaka',
      fasterPickupDropoff: 'Ho nka le ho isa ka potlako',
    },
  },

  tn: {
    translation: {
      language: 'Setswana',
      selectLanguage: 'Tlhopha Puo',
      placeNewOrder: 'Tsenya Odara e Ntšha',
      trackOrder: 'Latela Odara',
      orderHistory: 'Hisitori ya Di-odara',
      notifications: 'Dikitsiso',
      addresses: 'Diaterese',
      support: 'Tshegetso',
      rateApp: 'Lekanyetsa App',
      settings: 'Dikgato',
      account: 'Akhaonto',
      pushNotifications: 'Dikitsiso tsa push',
      orderStatusReminders: 'Maemo a odara le dikgopotso',
      emailNotifications: 'Dikitsiso tsa imeile',
      receiptsConfirmations: 'Dirisiti le ditshupo',
      smsUpdates: 'Dintlafatso tsa SMS',
      deliveryTimeUpdates: 'Dintlafatso tsa nako ya thomelo',
      locationServices: 'Ditirelo tsa lefelo',
      fasterPickupDropoff: 'Go tsaya le go isa ka bonako',
    },
  },

  ss: {
    translation: {
      language: 'siSwati',
      selectLanguage: 'Khetsa Lulwimi',
      placeNewOrder: 'Faka I-oda Lelisha',
      trackOrder: 'Landzela I-oda',
      orderHistory: 'Umlando Wema-oda',
      notifications: 'Tatiso',
      addresses: 'Emakheli',
      support: 'Lusito',
      rateApp: 'Hlola i-App',
      settings: 'Tingcinzelo',
      account: 'I-akhawunti',
      pushNotifications: 'Tatiso te-push',
      orderStatusReminders: 'Simo se-oda netikhumbuto',
      emailNotifications: 'Tatiso te-imeyili',
      receiptsConfirmations: 'Emarisidi neticinisekiso',
      smsUpdates: 'Tibuyeketo te-SMS',
      deliveryTimeUpdates: 'Tibuyeketo sikhatsi sekulethwa',
      locationServices: 'Tinsita tendzawo',
      fasterPickupDropoff: 'Kulandvwa nekulethwa ngekushesha',
    },
  },

  ve: {
    translation: {
      language: 'Tshivenda',
      selectLanguage: 'Nangani Luambo',
      placeNewOrder: 'Vhekanya Odara Ntswa',
      trackOrder: 'Tevhela Odara',
      orderHistory: 'Mivhigo ya Odara',
      notifications: 'Mauṅwalelo',
      addresses: 'Ḓiresi',
      support: 'Thuso',
      rateApp: 'Linganisa App',
      settings: 'Mavhekanyele',
      account: 'Akhawunti',
      pushNotifications: 'Mauṅwalelo a push',
      orderStatusReminders: 'Maimo a odara na zwikhumbudzo',
      emailNotifications: 'Mauṅwalelo a imeili',
      receiptsConfirmations: 'Marisiti na khwaṱhisedzo',
      smsUpdates: 'Khwiniso dza SMS',
      deliveryTimeUpdates: 'Khwiniso dza tshifhinga tsha u ḓiswa',
      locationServices: 'Vhuṱumani ha fhethu',
      fasterPickupDropoff: 'U dzhiiwa na u ḓiswa nga u ṱavhanya',
    },
  },

  ts: {
    translation: {
      language: 'itsonga',
      selectLanguage: 'Hlawula Ririmi',
      placeNewOrder: 'Veka Odara Leyintshwa',
      trackOrder: 'Landzelela Odara',
      orderHistory: 'Matimu ya Ti-odara',
      notifications: 'Switiviso',
      addresses: 'Tiadirese',
      support: 'Nseketelo',
      rateApp: 'Ringanisa App',
      settings: 'Swilungiselelo',
      account: 'Akhauntu',
      pushNotifications: 'Switiviso swa push',
      orderStatusReminders: 'Xiyimo xa odara na switsundzuxo',
      emailNotifications: 'Switiviso swa imeyili',
      receiptsConfirmations: 'Marisiti na minkombiselo',
      smsUpdates: 'Matsalwa ya SMS',
      deliveryTimeUpdates: 'Matsalwa ya nkarhi wa ku yisiwa',
      locationServices: 'Vukorhokeri bya ndhawu',
      fasterPickupDropoff: 'Ku tekiwa na ku yisiwa hi ku hatlisa',
    },
  },

  nr: {
    translation: {
      language: 'isiNdebele',
      selectLanguage: 'Khetha Ilimi',
      placeNewOrder: 'Faka I-oda Elitjha',
      trackOrder: 'Landelela I-oda',
      orderHistory: 'Umlando Wama-oda',
      notifications: 'Iimemezelo',
      addresses: 'Amakheli',
      support: 'Isizo',
      rateApp: 'Linganisela I-App',
      settings: 'Iimiso',
      account: 'I-akhawunti',
      pushNotifications: 'Iimemezelo ze-push',
      orderStatusReminders: 'Ubujamo be-oda neenkhumbuzo',
      emailNotifications: 'Iimemezelo ze-imeyili',
      receiptsConfirmations: 'Amarisidi neziqinisekiso',
      smsUpdates: 'Iimbuyekezo ze-SMS',
      deliveryTimeUpdates: 'Iimbuyekezo zesikhathi sokulethwa',
      locationServices: 'Iinsizakalo zendawo',
      fasterPickupDropoff: 'Ukuthathwa nokulethwa ngokurhaba',
    },
  },
};

const savedLanguage = async () => {
  return await AsyncStorage.getItem(LANGUAGE_KEY);
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

savedLanguage().then((language) => {
  if (language && resources[language as keyof typeof resources]) {
    i18n.changeLanguage(language);
  }
});

export async function changeLanguage(language: string) {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}

export default i18n;