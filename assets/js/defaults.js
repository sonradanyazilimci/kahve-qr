/* Varsayılan site içeriği. Buradaki her alan admin panelinden değiştirilebilir. */
window.DEFAULT_DATA = {
  updatedAt: 0,

  brand: {
    name: 'MONO',
    mark: 'M',
    tagline: 'Kahve & Glutensiz Atölye',
    pageTitle: 'MONO — Kahve & Glutensiz Atölye | QR Menü',
    metaDescription: 'Nitelikli kahve ve tamamı glutensiz tatlılar. MONO dijital menü.'
  },

  intro: {
    enabled: true,
    oncePerSession: false,
    video: 'https://assets.mixkit.co/videos/4982/4982-720.mp4',
    eyebrow: 'Nitelikli kahve · %100 glutensiz mutfak',
    title: 'Her fincan,\n*sakin* bir tören.',
    subtitle: 'Taze kavrulmuş çekirdekler ve glutensiz atölyemizden çıkan tatlılar.',
    button: 'Menüyü Keşfet',
    autoSkip: 0
  },

  background: {
    video: 'https://assets.mixkit.co/videos/4992/4992-720.mp4',
    overlay: 68,
    saturation: 10,
    playbackRate: 0.7
  },

  theme: {
    bg: '#080808',
    surface: '#131313',
    text: '#f4f2ed',
    muted: '#9b978f',
    accent: '#ffffff',
    fontDisplay: 'Cormorant Garamond',
    fontBody: 'Jost',
    radius: 22,
    float: 9,
    cardSaturation: 85,
    motion: true
  },

  hero: {
    eyebrow: 'Dijital Menü',
    title: 'Kahve ve *glutensiz* tatlı.',
    text: 'Bir karta dokunun; içeriği, kalorisi ve alerjenleriyle açılsın.'
  },

  menu: {
    allLabel: 'Tümü',
    currency: '₺',
    currencyPosition: 'after',
    note: 'Mutfağımızda gluten içeren hiçbir ürün bulunmaz.',
    empty: 'Bu kategoride henüz ürün yok.'
  },

  categories: [
    { id: 'kahve', name: 'Kahve', active: true },
    { id: 'soguk', name: 'Soğuk Kahve', active: true },
    { id: 'tatli', name: 'Glutensiz Tatlı', active: true }
  ],

  badges: [
    { id: 'glutensiz', label: 'Glutensiz', icon: '◎', highlight: false },
    { id: 'sef', label: 'Şefin Seçimi', icon: '✦', highlight: true },
    { id: 'imza', label: 'İmza Lezzet', icon: '✧', highlight: false },
    { id: 'vegan', label: 'Vegan', icon: '❦', highlight: false },
    { id: 'sekersiz', label: 'Şeker İlavesiz', icon: '○', highlight: false },
    { id: 'laktozsuz', label: 'Laktozsuz', icon: '◇', highlight: false },
    { id: 'yeni', label: 'Yeni', icon: '•', highlight: false }
  ],

  allergens: [
    { id: 'sut', label: 'Süt' },
    { id: 'yumurta', label: 'Yumurta' },
    { id: 'kuruyemis', label: 'Sert Kabuklu Yemiş' },
    { id: 'yerfistigi', label: 'Yer Fıstığı' },
    { id: 'soya', label: 'Soya' },
    { id: 'susam', label: 'Susam' }
  ],

  products: [
    {
      id: 'espresso', active: true, category: 'kahve', name: 'Espresso', price: 95,
      video: 'https://assets.mixkit.co/videos/47954/47954-360.mp4',
      desc: 'Yoğun gövde, bitter çikolata ve kavrulmuş fındık notaları.',
      ingredients: 'Tek köken Brezilya & Etiyopya harmanı espresso (çift shot).',
      kcal: 6, portion: '40 ml', badges: ['glutensiz', 'vegan', 'sekersiz'], allergens: []
    },
    {
      id: 'cortado', active: true, category: 'kahve', name: 'Cortado', price: 120,
      video: 'https://assets.mixkit.co/videos/46570/46570-360.mp4',
      desc: 'Espresso ve eşit ölçüde ipeksi süt. Dengeli, kısa ve net.',
      ingredients: 'Çift shot espresso, buharla ısıtılmış tam yağlı süt.',
      kcal: 70, portion: '120 ml', badges: ['glutensiz'], allergens: ['sut']
    },
    {
      id: 'cappuccino', active: true, category: 'kahve', name: 'Cappuccino', price: 135,
      video: 'https://assets.mixkit.co/videos/41859/41859-360.mp4',
      desc: 'Kadifemsi mikro köpük altında güçlü bir espresso.',
      ingredients: 'Çift shot espresso, süt, süt köpüğü.',
      kcal: 110, portion: '180 ml', badges: ['glutensiz'], allergens: ['sut']
    },
    {
      id: 'flat-white', active: true, category: 'kahve', name: 'Flat White', price: 140,
      video: 'https://assets.mixkit.co/videos/43245/43245-360.mp4',
      desc: 'İnce köpük, yoğun kahve. Baristalarımızın favorisi.',
      ingredients: 'Çift ristretto, ince dokulu buharlanmış süt.',
      kcal: 120, portion: '160 ml', badges: ['glutensiz', 'sef'], allergens: ['sut']
    },
    {
      id: 'latte', active: true, category: 'kahve', name: 'Caffè Latte', price: 140,
      video: 'https://assets.mixkit.co/videos/810/810-360.mp4',
      desc: 'Yumuşak içimli, bol sütlü; latte art ile servis edilir.',
      ingredients: 'Çift shot espresso, buharlanmış süt. Bitkisel süt seçeneği mevcuttur.',
      kcal: 170, portion: '280 ml', badges: ['glutensiz'], allergens: ['sut']
    },
    {
      id: 'v60', active: true, category: 'kahve', name: 'V60 Demleme', price: 160,
      video: 'https://assets.mixkit.co/videos/816/816-360.mp4',
      desc: 'Elde demleme. Yasemin, bergamot ve şeftali notalarıyla berrak bir fincan.',
      ingredients: 'Etiyopya Yirgacheffe (yıkanmış), filtrelenmiş su.',
      kcal: 4, portion: '250 ml', badges: ['glutensiz', 'vegan', 'imza'], allergens: []
    },
    {
      id: 'chemex', active: true, category: 'kahve', name: 'Chemex', price: 175,
      video: 'https://assets.mixkit.co/active_storage/video_items/100343/1723061803/100343-video-360.mp4',
      desc: 'İki kişilik paylaşım demlemesi. Temiz, çay benzeri gövde.',
      ingredients: 'Kolombiya Huila (doğal işlem), filtrelenmiş su.',
      kcal: 5, portion: '400 ml', badges: ['glutensiz', 'vegan'], allergens: []
    },
    {
      id: 'americano', active: true, category: 'kahve', name: 'Americano', price: 110,
      video: 'https://assets.mixkit.co/videos/43941/43941-360.mp4',
      desc: 'Sıcak su ile uzatılmış espresso. Sade ve uzun.',
      ingredients: 'Çift shot espresso, sıcak su.',
      kcal: 8, portion: '240 ml', badges: ['glutensiz', 'vegan', 'sekersiz'], allergens: []
    },
    {
      id: 'iced-latte', active: true, category: 'soguk', name: 'Buzlu Latte', price: 150,
      video: 'https://assets.mixkit.co/videos/796/796-360.mp4',
      desc: 'Buz üzerine soğuk süt ve taze espresso.',
      ingredients: 'Çift shot espresso, soğuk süt, buz.',
      kcal: 130, portion: '350 ml', badges: ['glutensiz', 'yeni'], allergens: ['sut']
    },
    {
      id: 'krema-mocha', active: true, category: 'soguk', name: 'Kremalı Mocha', price: 165,
      video: 'https://assets.mixkit.co/videos/3581/3581-360.mp4',
      desc: 'Bitter çikolata, espresso ve el çırpması krema.',
      ingredients: 'Espresso, %70 bitter çikolata, süt, krema.',
      kcal: 290, portion: '300 ml', badges: ['glutensiz', 'imza'], allergens: ['sut', 'soya']
    },
    {
      id: 'unsuz-cikolatali', active: true, category: 'tatli', name: 'Unsuz Çikolatalı Kek', price: 185,
      video: 'https://assets.mixkit.co/videos/41124/41124-360.mp4',
      desc: 'Hiç un kullanılmadan, yalnızca çikolata, yumurta ve tereyağı ile.',
      ingredients: '%70 bitter çikolata, tereyağı, yumurta, hindistan cevizi şekeri, kakao.',
      kcal: 410, portion: '1 dilim · 110 g', badges: ['glutensiz', 'sef'], allergens: ['sut', 'yumurta', 'soya']
    },
    {
      id: 'cikolata-dilim', active: true, category: 'tatli', name: 'Bademli Çikolata Dilimi', price: 170,
      video: 'https://assets.mixkit.co/videos/41120/41120-360.mp4',
      desc: 'Badem unlu ıslak taban, yoğun ganaj.',
      ingredients: 'Badem unu, bitter çikolata, krema, yumurta, tereyağı.',
      kcal: 380, portion: '1 dilim · 100 g', badges: ['glutensiz'], allergens: ['sut', 'yumurta', 'kuruyemis']
    },
    {
      id: 'findikli-donut', active: true, category: 'tatli', name: 'Fındıklı Fırın Donut', price: 130,
      video: 'https://assets.mixkit.co/active_storage/video_items/100267/1722625402/100267-video-360.mp4',
      desc: 'Kızartılmadan fırında pişer; pirinç unu ve kavrulmuş fındıkla.',
      ingredients: 'Pirinç unu, badem unu, yumurta, bitter çikolata, fındık.',
      kcal: 260, portion: '1 adet · 80 g', badges: ['glutensiz', 'yeni'], allergens: ['sut', 'yumurta', 'kuruyemis']
    },
    {
      id: 'hindistan-donut', active: true, category: 'tatli', name: 'Hindistan Cevizli Donut', price: 130,
      video: 'https://assets.mixkit.co/active_storage/video_items/100277/1722630391/100277-video-360.mp4',
      desc: 'Tamamen bitkisel; hindistan cevizi sütü ve rendesiyle.',
      ingredients: 'Pirinç unu, hindistan cevizi sütü, bitter çikolata, hindistan cevizi.',
      kcal: 240, portion: '1 adet · 80 g', badges: ['glutensiz', 'vegan', 'laktozsuz'], allergens: ['soya']
    },
    {
      id: 'kurabiye', active: true, category: 'tatli', name: 'Reçelli Kurabiye', price: 85,
      video: 'https://assets.mixkit.co/videos/3224/3224-360.mp4',
      desc: 'Karabuğday unlu tereyağlı kurabiye, ev yapımı ahududu reçeli.',
      ingredients: 'Karabuğday unu, tereyağı, yumurta, ahududu reçeli.',
      kcal: 150, portion: '2 adet · 45 g', badges: ['glutensiz'], allergens: ['sut', 'yumurta']
    },
    {
      id: 'dondurma', active: true, category: 'tatli', name: 'Vanilyalı Dondurma & Sos', price: 145,
      video: 'https://assets.mixkit.co/videos/10371/10371-360.mp4',
      desc: 'Madagaskar vanilyası, sıcak bitter çikolata sosu.',
      ingredients: 'Süt, krema, vanilya, bitter çikolata.',
      kcal: 310, portion: '2 top · 140 g', badges: ['glutensiz', 'imza'], allergens: ['sut', 'soya']
    },
    {
      id: 'petit-four', active: true, category: 'tatli', name: 'Petit Four Tabağı', price: 220,
      video: 'https://assets.mixkit.co/videos/26640/26640-360.mp4',
      desc: 'Günün glutensiz küçük pastalarından şefin seçkisi.',
      ingredients: 'Günlük değişir; alerjen bilgisi için ekibimize danışın.',
      kcal: 360, portion: '4 parça', badges: ['glutensiz', 'sef'], allergens: ['sut', 'yumurta', 'kuruyemis']
    },
    {
      id: 'vanilyali-pasta', active: true, category: 'tatli', name: 'Vanilyalı Krem Pasta', price: 180,
      video: 'https://assets.mixkit.co/videos/50015/50015-360.mp4',
      desc: 'Pirinç unlu pandispanya, hafif vanilya kreması.',
      ingredients: 'Pirinç unu, yumurta, krema, vanilya, pancar şekeri.',
      kcal: 340, portion: '1 dilim · 120 g', badges: ['glutensiz'], allergens: ['sut', 'yumurta']
    }
  ],

  about: {
    enabled: true,
    eyebrow: 'Hikâyemiz',
    title: 'Küçük partiler,\n*büyük* özen.',
    text: 'MONO, kahveyi sadeleştirmek için kuruldu. Çekirdeklerimizi haftalık küçük partiler halinde kavuruyor, her fincanı siparişle öğütüyoruz.\n\nMutfağımız ise baştan sona glutensiz: çapraz bulaşma riskini sıfırlamak için atölyemize buğday, arpa ve çavdar hiç girmiyor.',
    video: 'https://assets.mixkit.co/videos/796/796-720.mp4',
    stats: [
      { value: '%100', label: 'Glutensiz mutfak' },
      { value: '7 gün', label: 'İçinde kavrulmuş çekirdek' },
      { value: '12', label: 'Tek köken çiftlik' }
    ]
  },

  promise: {
    enabled: true,
    eyebrow: 'Glutensiz Sözümüz',
    title: 'Güvenle sipariş verin.',
    text: 'Çölyak ve gluten hassasiyeti olan misafirlerimiz için tasarlanmış bir mutfak.',
    items: [
      { title: 'Ayrı atölye', text: 'Üretim alanımıza gluten içeren hiçbir hammadde girmez.' },
      { title: 'Şeffaf içerik', text: 'Her ürünün alerjenleri ve kalorisi menüde açıkça yazar.' },
      { title: 'Sertifikalı tedarik', text: 'Unlarımız ve çikolatalarımız glutensiz sertifikalı üreticilerden gelir.' },
      { title: 'Günlük üretim', text: 'Tatlılarımız her sabah taze hazırlanır, ertesi güne kalmaz.' }
    ]
  },

  visit: {
    enabled: true,
    eyebrow: 'Ziyaret',
    title: 'Bir fincan uzaktayız.',
    address: 'Örnek Mah. Kahve Sok. No: 12\nKadıköy / İstanbul',
    mapUrl: 'https://maps.google.com',
    mapLabel: 'Yol tarifi al',
    phone: '+90 216 000 00 00',
    email: 'merhaba@ornek.com',
    hoursTitle: 'Çalışma Saatleri',
    hours: [
      { day: 'Pazartesi – Cuma', time: '08:00 – 22:00' },
      { day: 'Cumartesi', time: '09:00 – 23:00' },
      { day: 'Pazar', time: '09:00 – 21:00' }
    ]
  },

  social: [
    { label: 'Instagram', url: 'https://instagram.com' },
    { label: 'WhatsApp', url: 'https://wa.me/902160000000' }
  ],

  footer: {
    text: '© 2026 MONO Kahve Atölyesi. Tüm hakları saklıdır.',
    note: 'Fiyatlarımıza KDV dahildir.'
  },

  labels: {
    navMenu: 'Menü',
    navAbout: 'Hikâye',
    navPromise: 'Glutensiz',
    navVisit: 'Ziyaret',
    skip: 'Geç',
    scroll: 'Kaydır',
    close: 'Kapat',
    calories: 'Kalori',
    caloriesUnit: 'kcal',
    portion: 'Porsiyon',
    allergens: 'Alerjenler',
    noAllergens: 'Bilinen alerjen içermez.',
    ingredients: 'İçindekiler',
    disclaimer: 'Alerjiniz varsa lütfen sipariş öncesinde ekibimize bildirin.'
  }
};
