import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CalculatorIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  StarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const Services: React.FC = () => {
  const services = [
    {
      name: 'PodvojnA? As?TtovnA?ctvo',
      description: 'KompletnA? vedenie As?TtovnA?ctva pre vaL?u firmu s dA?razom na presnosLA a v?TasnosLA.',
      icon: CalculatorIcon,
      features: [
        'Vedenie podvojnA?ho As?TtovnA?ctva',
        'Spracovanie a archivA?cia dokladov',
        'Mesa?TnA? vA?kazy a reporty',
        'Ro?TnA? zAs?Ttovanie',
        'KomunikA?cia s finan?Tnou sprA?vou',
        'Kontrola a oprava chA?b'
      ],
      price: 'od 150?,?/mesiac',
      duration: 'Mesa?TnA? spracovanie'
    },
    {
      name: 'JednoduchA? As?TtovnA?ctvo',
      description: 'As?TtovnA?ctvo pre SZ?SO a malA? firmy s jednoduchA?m a preh?ladnA?m systA?mom.',
      icon: DocumentTextIcon,
      features: [
        'JednoduchA? As?TtovnA?ctvo',
        'DaL?ovA? priznania',
        'Online prA?stup k dokladom',
        'OsobnA? poradenstvo',
        'KomunikA?cia s Asradmi',
        'RA?chle spracovanie'
      ],
      price: 'od 80?,?/mesiac',
      duration: 'Mesa?TnA? spracovanie'
    },
    {
      name: 'Mzdy a personalistika',
      description: 'KompletnA? spracovanie miezd a personalistika pre vaL?u firmu.',
      icon: UserGroupIcon,
      features: [
        'Spracovanie miezd zamestnancov',
        'KomunikA?cia so SociA?lnou poisLAovL?ou',
        'KomunikA?cia so zdravotnA?mi poisLAovL?ami',
        'Personalistika a HR sluLlby',
        'Mzdy online - prA?stup pre zamestnancov',
        'VA?po?Tet dovoleniek a nemocenskA?ch'
      ],
      price: 'od 15?,?/zamestnanec',
      duration: 'Mesa?TnA? spracovanie'
    },
    {
      name: 'DaL?ovA? poradenstvo',
      description: 'ProfesionA?lne daL?ovA? poradenstvo a optimalizA?cia pre vaL?u firmu.',
      icon: ChartBarIcon,
      features: [
        'DaL?ovA? priznania (DPFO, DPH)',
        'OptimalizA?cia daL?ovA?ho zaLAaLlenia',
        'Poradenstvo pri daL?ovA?ch otA?zkach',
        'Sledovanie legislatA?vnych zmien',
        'DaL?ovA? plA?novanie',
        'KomunikA?cia s daL?ovA?mi Asradmi'
      ],
      price: 'od 200?,?/rok',
      duration: 'Pod?la potreby'
    }
  ];

  const benefits = [
    {
      title: 'Online prA?stup 24/7',
      description: 'Bezpe?TnA? prA?stup k vaL?im dokladom a vA?kazom kedyko?lvek a kdeko?lvek.',
      icon: ShieldCheckIcon
    },
    {
      title: 'KomunikA?cia s As?TtovnA?kom',
      description: 'Priama komunikA?cia s vaL?A?m As?TtovnA?kom cez portA?l, email alebo telefon.',
      icon: PhoneIcon
    },
    {
      title: 'Bezpe?TnA? prenos dokumentov',
      description: 'Bezpe?TnA? nahrA?vanie a prenos dokumentov s najvyL?L?ou AsrovL?ou ochrany.',
      icon: ShieldCheckIcon
    },
    {
      title: 'RA?chle spracovanie',
      description: 'GarantovanA? termA?ny spracovania vaL?ich dokladov a vA?kazov.',
      icon: ClockIcon
    },
    {
      title: 'TransparentnA? ceny',
      description: 'JasnA? a transparentnA? ceny bez skrytA?ch poplatkov.',
      icon: CurrencyDollarIcon
    },
    {
      title: 'OsobnA? poradenstvo',
      description: 'OsobnA? poradenstvo a konzultA?cie pre vaL?u firmu.',
      icon: UserGroupIcon
    }
  ];

  const process = [
    {
      step: '1',
      title: 'Kontakt a konzultA?cia',
      description: 'PrvA? kontakt a bezplatnA? konzultA?cia vaL?ich potrieb.'
    },
    {
      step: '2',
      title: 'Dohoda o spoluprA?ci',
      description: 'PodpA?sanie zmluvy a dohoda o podmienkach spoluprA?ce.'
    },
    {
      step: '3',
      title: 'Nastavenie portA?lu',
      description: 'Vytvorenie prA?stupu do klientskA?ho portA?lu a nastavenie.'
    },
    {
      step: '4',
      title: 'Za?Tiatok spoluprA?ce',
      description: 'Za?Tiatok spracovania vaL?ich dokladov a vA?kazov.'
    }
  ];

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              NaL?e sluLlby
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              KompletnA? rieL?enia v oblasti As?TtovnA?ctva, miezd a daL?ovA?ho poradenstva. 
              Poskytujeme profesionA?lne sluLlby s dA?razom na kvalitu a spo?lahlivosLA.
            </p>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              KompletnA? rieL?enia pre vaL?u firmu
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Vyberte si sluLlby, ktorA? najlepL?ie vyhovujAs potrebA?m vaL?ej firmy
            </p>
          </div>
          
          <div className="space-y-12">
            {services.map((service, index) => (
              <div key={service.name} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
                <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <div className="flex items-center mb-6">
                    <div className="bg-blue-600 rounded-lg p-3 mr-4">
                      <service.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{service.name}</h3>
                  </div>
                  <p className="text-lg text-gray-600 mb-6">{service.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500">Cena</div>
                      <div className="text-xl font-bold text-blue-600">{service.price}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500">Frekvencia</div>
                      <div className="text-xl font-bold text-gray-900">{service.duration}</div>
                    </div>
                  </div>
                  
                  <ul className="space-y-3">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-8">
                    <Link
                      to="/contact"
                      className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      ObjednaLA sluLlbu
                      <ArrowRightIcon className="h-5 w-5 ml-2" />
                    </Link>
                  </div>
                </div>
                
                <div className={`bg-gray-50 rounded-lg p-8 ${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                  <div className="text-center">
                    <div className="bg-blue-600 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                      <service.icon className="h-12 w-12 text-white" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h4>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                    <div className="text-2xl font-bold text-blue-600 mb-2">{service.price}</div>
                    <div className="text-sm text-gray-500">{service.duration}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pre?To si vybraLA naL?e sluLlby?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              VA?hody, ktorA? zA?skate s naL?imi sluLlbami
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="bg-white rounded-lg p-6 shadow-md">
                <div className="bg-blue-600 rounded-full p-3 w-12 h-12 mb-4 flex items-center justify-center">
                  <benefit.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ako za?TaLA spoluprA?cu?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              JednoduchA? proces za?Tiatku spoluprA?ce v 4 krokoch
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((step) => (
              <div key={step.step} className="text-center">
                <div className="bg-blue-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">{step.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              PripravenA? za?TaLA spoluprA?cu?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Kontaktujte nA?s a dohodneme si bezplatnAs konzultA?ciu pre vaL?u firmu
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
              >
                KontaktovaLA nA?s
              </Link>
              <Link
                to="/about"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors"
              >
                ZistiLA viac o nA?s
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;

