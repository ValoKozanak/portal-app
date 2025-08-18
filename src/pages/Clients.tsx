import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UserGroupIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PlayIcon,
  ComputerDesktopIcon,
  LockClosedIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Clients: React.FC = () => {
  const portalFeatures = [
    {
      title: 'Nahrávanie dokladov',
      description: 'Bezpečné nahrávanie faktúr, účteniek a ďalších dokladov cez portál.',
      icon: DocumentTextIcon
    },
    {
      title: 'Prehľad platieb',
      description: 'Priehľadný prehľad všetkých platieb, faktúr a záväzkov.',
      icon: ChartBarIcon
    },
    {
      title: 'Komunikácia s účtovníkom',
      description: 'Priama komunikácia s vaším účtovníkom cez chat alebo správy.',
      icon: PhoneIcon
    },
    {
      title: 'Online správy',
      description: 'Prístup k mesačným a ročným správam kedykoľvek.',
      icon: DocumentTextIcon
    },
    {
      title: 'Bezpečný prístup',
      description: 'Najvyššia úroveň bezpečnosti a ochrany vašich údajov.',
      icon: LockClosedIcon
    },
    {
      title: '24/7 dostupnosť',
      description: 'Prístup k vašim dokladom a informáciám kedykoľvek.',
      icon: ClockIcon
    }
  ];

  const workflow = [
    {
      step: '1',
      title: 'Registrácia a nastavenie',
      description: 'Vytvorenie účtu a nastavenie prístupu do klientského portálu.'
    },
    {
      step: '2',
      title: 'Nahrávanie dokladov',
      description: 'Bezpečné nahrávanie faktúr a dokladov cez portál.'
    },
    {
      step: '3',
      title: 'Spracovanie účtovníkom',
      description: 'Váš účtovník spracuje nahrané doklady a pripraví výkazy.'
    },
    {
      step: '4',
      title: 'Prehľad a komunikácia',
      description: 'Prístup k spracovaným výkazom a komunikácia s účtovníkom.'
    }
  ];

  const benefits = [
    {
      title: 'Úspora času',
      description: 'Ušetríte čas na cestách a osobných stretnutiach.',
      icon: ClockIcon
    },
    {
      title: 'Prehľadnosť',
      description: 'Všetky vaše doklady a výkazy na jednom mieste.',
      icon: ChartBarIcon
    },
    {
      title: 'Bezpečnosť',
      description: 'Najvyššia úroveň ochrany vašich citlivých údajov.',
      icon: ShieldCheckIcon
    },
    {
      title: 'Flexibilita',
      description: 'Prístup k vašim údajom kedykoľvek a kdekoľvek.',
      icon: ComputerDesktopIcon
    }
  ];

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              Pre klientov
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Zistite, ako funguje komunikácia s účtovníkom a aké výhody 
              prináša náš klientský portál pre vašu firmu.
            </p>
          </div>
        </div>
      </div>

      {/* Communication Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Ako funguje komunikácia s účtovníkom?
              </h2>
              <div className="space-y-4 text-lg text-gray-600">
                <p>
                  Naša komunikácia je založená na princípe transparentnosti a 
                  spoľahlivosti. Každý klient má priradeného účtovníka, ktorý 
                  sa stará o jeho účtovníctvo.
                </p>
                <p>
                  Komunikácia prebieha cez náš bezpečný klientský portál, 
                  kde môžete nahrávať doklady, komunikovať s účtovníkom 
                  a sledovať stav spracovania.
                </p>
                <p>
                  Okrem portálu môžete komunikovať aj telefonicky alebo 
                  emailom - váš účtovník je vždy dostupný pre vaše otázky.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-8">
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-blue-600 rounded-full p-2 mr-4">
                    <PhoneIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Telefonická komunikácia</h3>
                    <p className="text-gray-600">Priama komunikácia s vaším účtovníkom</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-600 rounded-full p-2 mr-4">
                    <EnvelopeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email komunikácia</h3>
                    <p className="text-gray-600">Rýchla komunikácia cez email</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-600 rounded-full p-2 mr-4">
                    <ComputerDesktopIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Klientský portál</h3>
                    <p className="text-gray-600">Bezpečná komunikácia cez portál</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portal Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Výhody klientského portálu
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Moderné riešenie pre efektívnu komunikáciu a správu vašich dokladov
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {portalFeatures.map((feature) => (
              <div key={feature.title} className="bg-white rounded-lg p-6 shadow-md">
                <div className="bg-blue-600 rounded-full p-3 w-12 h-12 mb-4 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video/Infographic Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ako pracujeme
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Jednoduchý proces spolupráce v 4 krokoch
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workflow.map((step) => (
              <div key={step.step} className="text-center">
                <div className="bg-blue-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">{step.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <div className="bg-gray-100 rounded-lg p-8 max-w-4xl mx-auto">
              <div className="flex items-center justify-center mb-4">
                <PlayIcon className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Video návod: Ako používať klientský portál
              </h3>
              <p className="text-gray-600 mb-4">
                Pozrite si krátke video, ktoré vám ukáže, ako jednoducho používať náš portál
              </p>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Prehrať video
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Prečo používať klientský portál?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Výhody, ktoré získate s používaním nášho portálu
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="bg-blue-600 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <benefit.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login CTA Section */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              Pripravení začať používať portál?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Prihláste sa do klientského portálu a objavte všetky jeho možnosti
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
              >
                Prihlásiť sa do portálu
              </Link>
              <Link
                to="/contact"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors"
              >
                Kontaktovať nás
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Clients;
