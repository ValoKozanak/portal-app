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
      title: 'NahrA?vanie dokladov',
      description: 'Bezpe�TnA� nahrA?vanie faktAsr, As�Tteniek a �ZalL?A�ch dokladov cez portA?l.',
      icon: DocumentTextIcon
    },
    {
      title: 'Preh�lad platieb',
      description: 'Prieh�ladnA? preh�lad vL?etkA?ch platieb, faktAsr a zA?vA�zkov.',
      icon: ChartBarIcon
    },
    {
      title: 'KomunikA?cia s As�TtovnA�kom',
      description: 'Priama komunikA?cia s vaL?A�m As�TtovnA�kom cez chat alebo sprA?vy.',
      icon: PhoneIcon
    },
    {
      title: 'Online sprA?vy',
      description: 'PrA�stup k mesa�TnA?m a ro�TnA?m sprA?vam kedyko�lvek.',
      icon: DocumentTextIcon
    },
    {
      title: 'Bezpe�TnA? prA�stup',
      description: 'NajvyL?L?ia AsroveL� bezpe�Tnosti a ochrany vaL?ich Asdajov.',
      icon: LockClosedIcon
    },
    {
      title: '24/7 dostupnosLA',
      description: 'PrA�stup k vaL?im dokladom a informA?ciA?m kedyko�lvek.',
      icon: ClockIcon
    }
  ];

  const workflow = [
    {
      step: '1',
      title: 'RegistrA?cia a nastavenie',
      description: 'Vytvorenie As�Ttu a nastavenie prA�stupu do klientskA�ho portA?lu.'
    },
    {
      step: '2',
      title: 'NahrA?vanie dokladov',
      description: 'Bezpe�TnA� nahrA?vanie faktAsr a dokladov cez portA?l.'
    },
    {
      step: '3',
      title: 'Spracovanie As�TtovnA�kom',
      description: 'VA?L? As�TtovnA�k spracuje nahranA� doklady a pripravA� vA?kazy.'
    },
    {
      step: '4',
      title: 'Preh�lad a komunikA?cia',
      description: 'PrA�stup k spracovanA?m vA?kazom a komunikA?cia s As�TtovnA�kom.'
    }
  ];

  const benefits = [
    {
      title: 'Asspora �Tasu',
      description: 'UL?etrA�te �Tas na cestA?ch a osobnA?ch stretnutiach.',
      icon: ClockIcon
    },
    {
      title: 'Preh�ladnosLA',
      description: 'VL?etky vaL?e doklady a vA?kazy na jednom mieste.',
      icon: ChartBarIcon
    },
    {
      title: 'Bezpe�TnosLA',
      description: 'NajvyL?L?ia AsroveL� ochrany vaL?ich citlivA?ch Asdajov.',
      icon: ShieldCheckIcon
    },
    {
      title: 'Flexibilita',
      description: 'PrA�stup k vaL?im Asdajom kedyko�lvek a kdeko�lvek.',
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
              Zistite, ako funguje komunikA?cia s As�TtovnA�kom a akA� vA?hody 
              prinA?L?a nA?L? klientskA? portA?l pre vaL?u firmu.
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
                Ako funguje komunikA?cia s As�TtovnA�kom?
              </h2>
              <div className="space-y-4 text-lg text-gray-600">
                <p>
                  NaL?a komunikA?cia je zaloLlenA? na princA�pe transparentnosti a 
                  spo�lahlivosti. KaLldA? klient mA? priradenA�ho As�TtovnA�ka, ktorA? 
                  sa starA? o jeho As�TtovnA�ctvo.
                </p>
                <p>
                  KomunikA?cia prebieha cez nA?L? bezpe�TnA? klientskA? portA?l, 
                  kde mA�Llete nahrA?vaLA doklady, komunikovaLA s As�TtovnA�kom 
                  a sledovaLA stav spracovania.
                </p>
                <p>
                  Okrem portA?lu mA�Llete komunikovaLA aj telefonicky alebo 
                  emailom - vA?L? As�TtovnA�k je vLldy dostupnA? pre vaL?e otA?zky.
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
                    <h3 className="font-semibold text-gray-900 mb-1">TelefonickA? komunikA?cia</h3>
                    <p className="text-gray-600">Priama komunikA?cia s vaL?A�m As�TtovnA�kom</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-600 rounded-full p-2 mr-4">
                    <EnvelopeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email komunikA?cia</h3>
                    <p className="text-gray-600">RA?chla komunikA?cia cez email</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-600 rounded-full p-2 mr-4">
                    <ComputerDesktopIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">KlientskA? portA?l</h3>
                    <p className="text-gray-600">Bezpe�TnA? komunikA?cia cez portA?l</p>
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
              VA?hody klientskA�ho portA?lu
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ModernA� rieL?enie pre efektA�vnu komunikA?ciu a sprA?vu vaL?ich dokladov
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
              JednoduchA? proces spoluprA?ce v 4 krokoch
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
                Video nA?vod: Ako pouLlA�vaLA klientskA? portA?l
              </h3>
              <p className="text-gray-600 mb-4">
                Pozrite si krA?tke video, ktorA� vA?m ukA?Lle, ako jednoducho pouLlA�vaLA nA?L? portA?l
              </p>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                PrehraLA video
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
              Pre�To pouLlA�vaLA klientskA? portA?l?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              VA?hody, ktorA� zA�skate s pouLlA�vanA�m nA?L?ho portA?lu
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
              PripravenA� za�TaLA pouLlA�vaLA portA?l?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              PrihlA?ste sa do klientskA�ho portA?lu a objavte vL?etky jeho moLlnosti
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
              >
                PrihlA?siLA sa do portA?lu
              </Link>
              <Link
                to="/contact"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors"
              >
                KontaktovaLA nA?s
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Clients;

