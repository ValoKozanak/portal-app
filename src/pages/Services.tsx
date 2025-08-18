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
      name: 'Podvojné účtovníctvo',
      description: 'Kompletné vedenie účtovníctva pre vašu firmu s dôrazom na presnosť a včasnosť.',
      icon: CalculatorIcon,
      features: [
        'Vedenie podvojného účtovníctva',
        'Spracovanie a archivácia dokladov',
        'Mesačné výkazy a reporty',
        'Ročné zúčtovanie',
        'Komunikácia s finančnou správou',
        'Kontrola a oprava chýb'
      ],
      price: 'od 150€/mesiac',
      duration: 'Mesačné spracovanie'
    },
    {
      name: 'Jednoduché účtovníctvo',
      description: 'Účtovníctvo pre SZČO a malé firmy s jednoduchým a prehľadným systémom.',
      icon: DocumentTextIcon,
      features: [
        'Jednoduché účtovníctvo',
        'Daňové priznania',
        'Online prístup k dokladom',
        'Osobné poradenstvo',
        'Komunikácia s úradmi',
        'Rýchle spracovanie'
      ],
      price: 'od 80€/mesiac',
      duration: 'Mesačné spracovanie'
    },
    {
      name: 'Mzdy a personalistika',
      description: 'Kompletné spracovanie miezd a personalistika pre vašu firmu.',
      icon: UserGroupIcon,
      features: [
        'Spracovanie miezd zamestnancov',
        'Komunikácia so Sociálnou poisťovňou',
        'Komunikácia so zdravotnými poisťovňami',
        'Personalistika a HR služby',
        'Mzdy online - prístup pre zamestnancov',
        'Výpočet dovoleniek a nemocenských'
      ],
      price: 'od 15€/zamestnanec',
      duration: 'Mesačné spracovanie'
    },
    {
      name: 'Daňové poradenstvo',
      description: 'Profesionálne daňové poradenstvo a optimalizácia pre vašu firmu.',
      icon: ChartBarIcon,
      features: [
        'Daňové priznania (DPFO, DPH)',
        'Optimalizácia daňového zaťaženia',
        'Poradenstvo pri daňových otázkach',
        'Sledovanie legislatívnych zmien',
        'Daňové plánovanie',
        'Komunikácia s daňovými úradmi'
      ],
      price: 'od 200€/rok',
      duration: 'Podľa potreby'
    }
  ];

  const benefits = [
    {
      title: 'Online prístup 24/7',
      description: 'Bezpečný prístup k vašim dokladom a výkazom kedykoľvek a kdekoľvek.',
      icon: ShieldCheckIcon
    },
    {
      title: 'Komunikácia s účtovníkom',
      description: 'Priama komunikácia s vaším účtovníkom cez portál, email alebo telefon.',
      icon: PhoneIcon
    },
    {
      title: 'Bezpečný prenos dokumentov',
      description: 'Bezpečné nahrávanie a prenos dokumentov s najvyššou úrovňou ochrany.',
      icon: ShieldCheckIcon
    },
    {
      title: 'Rýchle spracovanie',
      description: 'Garantované termíny spracovania vašich dokladov a výkazov.',
      icon: ClockIcon
    },
    {
      title: 'Transparentné ceny',
      description: 'Jasné a transparentné ceny bez skrytých poplatkov.',
      icon: CurrencyDollarIcon
    },
    {
      title: 'Osobné poradenstvo',
      description: 'Osobné poradenstvo a konzultácie pre vašu firmu.',
      icon: UserGroupIcon
    }
  ];

  const process = [
    {
      step: '1',
      title: 'Kontakt a konzultácia',
      description: 'Prvý kontakt a bezplatná konzultácia vašich potrieb.'
    },
    {
      step: '2',
      title: 'Dohoda o spolupráci',
      description: 'Podpísanie zmluvy a dohoda o podmienkach spolupráce.'
    },
    {
      step: '3',
      title: 'Nastavenie portálu',
      description: 'Vytvorenie prístupu do klientského portálu a nastavenie.'
    },
    {
      step: '4',
      title: 'Začiatok spolupráce',
      description: 'Začiatok spracovania vašich dokladov a výkazov.'
    }
  ];

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              Naše služby
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Kompletné riešenia v oblasti účtovníctva, miezd a daňového poradenstva. 
              Poskytujeme profesionálne služby s dôrazom na kvalitu a spoľahlivosť.
            </p>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Kompletné riešenia pre vašu firmu
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Vyberte si služby, ktoré najlepšie vyhovujú potrebám vašej firmy
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
                      Objednať službu
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
              Prečo si vybrať naše služby?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Výhody, ktoré získate s našimi službami
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
              Ako začať spoluprácu?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Jednoduchý proces začiatku spolupráce v 4 krokoch
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
              Pripravení začať spoluprácu?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Kontaktujte nás a dohodneme si bezplatnú konzultáciu pre vašu firmu
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
              >
                Kontaktovať nás
              </Link>
              <Link
                to="/about"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors"
              >
                Zistiť viac o nás
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
