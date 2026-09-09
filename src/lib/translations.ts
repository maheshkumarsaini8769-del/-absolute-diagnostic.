export type Language = 'en' | 'hi';

export const translations = {
  en: {
    // Navigation
    home: 'Home',
    about: 'About Us',
    tests: 'All Tests',
    packages: 'Health Packages',
    bookTest: 'Book a Test',
    reports: 'Download Reports',
    branches: 'Branches',
    contact: 'Contact Us',
    uploadPrescription: 'Upload Prescription',
    patientPortal: 'Patient Portal',
    emergencyService: '24/7 Night Service',

    // Hero & Home
    heroTitle: 'Accurate & Trusted Diagnostic Care at Your Doorstep',
    heroSubtitle: 'Certified pathology lab with automated analyzers, fast digital reports, and convenient home sample collection in 30 minutes.',
    searchPlaceholder: 'Search tests (e.g. CBC, Thyroid, Sugar, Lipid)...',
    bookHomeCollection: 'Book Home Collection',
    findTests: 'Explore All Tests',
    popularTests: 'Popular Diagnostic Tests',
    popularPackages: 'Comprehensive Health Packages',
    whyChooseUs: 'Why Choose Absolute Diagnostic?',
    certifiedLab: 'NABL & ISO Certified Lab',
    fastReports: 'Same-Day Digital Reports',
    homeCollectionBadge: 'Safe & Hygienic Home Collection',
    affordablePricing: 'Affordable & Transparent Pricing',

    // Test & Fasting
    fastingRequired: 'Fasting Required (10-12 hrs)',
    fastingNotice: 'Please remain fasting overnight (water is allowed) before sample collection.',
    sampleType: 'Sample Type',
    reportTime: 'Report Time',
    price: 'Price',
    addToCart: 'Add to Cart',
    addedToCart: 'Added to Cart',
    viewDetails: 'View Details',

    // Cart & Checkout
    myCart: 'My Cart',
    emptyCart: 'Your cart is empty',
    collectionType: 'Collection Preference',
    homeCollection: 'Home Collection',
    centerVisit: 'Visit Center / Lab',
    patientDetails: 'Patient Information',
    fullName: 'Full Name',
    mobileNumber: 'Mobile Number',
    completeAddress: 'Complete Address & Landmark',
    preferredDate: 'Preferred Date',
    preferredTime: 'Preferred Time Slot',
    couponCode: 'Have a Coupon Code?',
    applyCoupon: 'Apply',
    couponDiscount: 'Coupon Discount',
    subtotal: 'Subtotal',
    homeCollectionCharge: 'Home Collection Fee',
    totalPayable: 'Total Payable',
    confirmBooking: 'Confirm & Book Now',
    bookingSuccess: 'Booking Confirmed Successfully!',

    // Family Members
    bookingFor: 'Booking For',
    self: 'Myself',
    addFamilyMember: '+ Add Family Member',
    relation: 'Relation',
    age: 'Age',

    // WhatsApp
    chatOnWhatsApp: 'Chat & Book on WhatsApp',
    quickAssistance: 'Need quick help with test booking?',
  },
  hi: {
    // Navigation
    home: 'होम',
    about: 'हमारे बारे में',
    tests: 'सभी टेस्ट',
    packages: 'हेल्थ पैकेज',
    bookTest: 'टेस्ट बुक करें',
    reports: 'रिपोर्ट डाउनलोड करें',
    branches: 'शाखाएं / केंद्र',
    contact: 'संपर्क करें',
    uploadPrescription: 'पर्ची (Prescription) भेजें',
    patientPortal: 'मरीज़ पोर्टल',
    emergencyService: '24/7 नाइट सेवा',

    // Hero & Home
    heroTitle: 'सटीक, भरोसेमंद जांच — अब आपके घर पर',
    heroSubtitle: 'आधुनिक मशीनों, प्रमाणित पैथोलॉजी, तुरंत डिजिटल रिपोर्ट और मात्र 30 मिनट में घर बैठे ब्लड सैंपल कलेक्शन की सुविधा।',
    searchPlaceholder: 'टेस्ट खोजें (जैसे CBC, थायराइड, शुगर, लिपिड)...',
    bookHomeCollection: 'घर पर सैंपल बुक करें',
    findTests: 'सभी टेस्ट देखें',
    popularTests: 'प्रमुख ब्लड टेस्ट',
    popularPackages: 'सम्पूर्ण स्वास्थ्य चेकअप पैकेज',
    whyChooseUs: 'एब्सोल्यूट डायग्नोस्टिक ही क्यों चुनें?',
    certifiedLab: 'NABL एवं ISO प्रमाणित लैब',
    fastReports: 'उसी दिन डिजिटल रिपोर्ट',
    homeCollectionBadge: 'सुरक्षित व हाइजीनिक होम कलेक्शन',
    affordablePricing: 'उचित एवं पारदर्शी दरें',

    // Test & Fasting
    fastingRequired: 'उपवास (Fasting 10-12 घंटे) आवश्यक',
    fastingNotice: 'कृपया टेस्ट से पहले 10-12 घंटे खाली पेट रहें (केवल सादा पानी पी सकते हैं)।',
    sampleType: 'सैंपल का प्रकार',
    reportTime: 'रिपोर्ट का समय',
    price: 'मूल्य',
    addToCart: 'कार्ट में जोड़ें',
    addedToCart: 'कार्ट में जोड़ा गया',
    viewDetails: 'विवरण देखें',

    // Cart & Checkout
    myCart: 'मेरी कार्ट',
    emptyCart: 'आपकी कार्ट खाली है',
    collectionType: 'सैंपल देने का तरीका',
    homeCollection: 'घर पर कलेक्शन (Home Collection)',
    centerVisit: 'लैब / सेंटर जाकर करवाएं',
    patientDetails: 'मरीज़ की जानकारी',
    fullName: 'पूरा नाम',
    mobileNumber: 'मोबाइल नंबर',
    completeAddress: 'पूरा पता व लैंडमार्क',
    preferredDate: 'पसंदीदा तारीख',
    preferredTime: 'पसंदीदा समय',
    couponCode: 'कूपन कोड है?',
    applyCoupon: 'लागू करें (Apply)',
    couponDiscount: 'कूपन छूट',
    subtotal: 'कुल टेस्ट मूल्य',
    homeCollectionCharge: 'होम कलेक्शन शुल्क',
    totalPayable: 'कुल देय राशि',
    confirmBooking: 'बुकिंग कन्फर्म करें',
    bookingSuccess: 'बुकिंग सफलतापूर्वक दर्ज हो गई!',

    // Family Members
    bookingFor: 'किसके लिए बुक कर रहे हैं',
    self: 'स्वयं (Myself)',
    addFamilyMember: '+ परिवार के सदस्य जोड़ें',
    relation: 'रिश्ता (Relation)',
    age: 'उम्र (Age)',

    // WhatsApp
    chatOnWhatsApp: 'व्हाट्सएप पर तुरंत बुक करें',
    quickAssistance: 'टेस्ट बुक करने में मदद चाहिए?',
  }
};
