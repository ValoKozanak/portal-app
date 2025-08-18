import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UserGroupIcon,
  ShieldCheckIcon,
  ClockIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const About: React.FC = () => {
  const team = [
    {
      name: 'Ing. Mária Kováčová',
      position: 'Hlavná účtovníčka',
      specialization: 'Podvojné účtovníctvo, daňové poradenstvo',
      experience: '15+ rokov skúseností',
      education: 'Ekonomická univerzita Bratislava',
      image: '/api/placeholder/150/150'
    },
    {
      name: 'Mgr. Peter Novák',
      position: 'Daňový poradca',
      specialization: 'Daňové priznania, optimalizácia daní',
      experience: '12+ rokov skúseností',
      education: 'Právnická fakulta UK Bratislava',
      image: '/api/placeholder/150/150'
    },
    {
      name: 'Bc. Jana Svobodová',
      position: 'Mzdy a personalistika',
      specialization: 'Spracovanie miezd, personalistika',
      experience: '8+ rokov skúseností',
      education: 'Fakulta podnikového hospodárstva',
      image: '/api/placeholder/150/150'
    }
  ];

  const values = [
    {
      title: 'Transparentnosť',
      description: 'Všetky naše služby sú transparentné s jasnými cenami a podmienkami.',
      icon: ShieldCheckIcon
    },
    {
      title: 'Spoľahlivosť',
      description: 'Spoľahli sme sa na presnosť a včasnosť všetkých našich služieb.',
      icon: CheckCircleIcon
    },
    {
      title: 'Dôvernosť údajov',
      description: 'Vaše údaje sú v bezpečí s najvyššou úrovňou ochrany a dôvernosti.',
      icon: ShieldCheckIcon
    },
    {
      title: 'Dlhodobá spolupráca',
      description: 'Budujeme dlhodobé vzťahy založené na dôvere a kvalite služieb.',
      icon: ClockIcon
    }
  ];

  const certifications = [
    {
      name: 'SKAU - Slovenská komora audítorov',
      description: 'Členstvo v profesijnej organizácii'
    },
    {
      name: 'Daňové poradenstvo',
      description: 'Certifikovaný daňový poradca'
    },
    {
      name: 'ISO 27001',
      description: 'Bezpečnosť informácií'
    },
    {
      name: 'GDPR Compliance',
      description: 'Ochrana osobných údajov'
    }
  ];

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              O našej kancelárii
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Viac ako 20 rokov poskytujeme profesionálne účtovníctvo a daňové poradenstvo. 
              Naša história je založená na dôvere, spoľahlivosti a dlhodobej spolupráci s klientmi.
            </p>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Naša história a filozofia
              </h2>
              <div className="space-y-4 text-lg text-gray-600">
                <p>
                  Naša účtovnícka kancelária vznikla v roku 2003 s cieľom poskytovať 
                  kvalitné a spoľahlivé účtovníctvo pre malé a stredné podniky.
                </p>
                <p>
                  Počas viac ako 20 rokov sme si vybudovali silnú pozíciu na trhu 
                  a získali dôveru stoviek spokojných klientov.
                </p>
                <p>
                  Naša filozofia je založená na princípoch transparentnosti, 
                  spoľahlivosti a dlhodobej spolupráce. Veríme, že úspech našich 
                  klientov je aj naším úspechom.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">20+</div>
                  <div className="text-gray-600">Rokov skúseností</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
                  <div className="text-gray-600">Spokojných klientov</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">15+</div>
                  <div className="text-gray-600">Odborníkov v tíme</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
                  <div className="text-gray-600">Online prístup</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Náš tím
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Skúsení odborníci s dlhoročnou praxou v oblasti účtovníctva a daní
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member) => (
              <div key={member.name} className="bg-white rounded-lg p-6 shadow-lg">
                <div className="text-center mb-6">
                  <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <UserGroupIcon className="h-16 w-16 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-1">{member.position}</p>
                  <p className="text-sm text-gray-600 mb-3">{member.specialization}</p>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2 text-blue-600" />
                    <span>{member.experience}</span>
                  </div>
                  <div className="flex items-center">
                    <AcademicCapIcon className="h-4 w-4 mr-2 text-blue-600" />
                    <span>{member.education}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Naše hodnoty a prístup
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Princípy, ktoré nás vedú v každej našej práci
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="bg-blue-600 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <value.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Certifications Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Certifikáty a členstvá
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Naše kvalifikácie a členstvá v profesijných organizáciách
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert) => (
              <div key={cert.name} className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex items-center mb-3">
                  <StarIcon className="h-6 w-6 text-yellow-400 mr-2" />
                  <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                </div>
                <p className="text-gray-600 text-sm">{cert.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              Chcete sa dozvedieť viac?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Kontaktujte nás a dohodneme si osobné stretnutie
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
              >
                Kontaktovať nás
              </Link>
              <Link
                to="/services"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors"
              >
                Naše služby
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;

