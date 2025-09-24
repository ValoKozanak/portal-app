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
      name: 'Ing. MA?ria KovA?�TovA?',
      position: 'HlavnA? As�TtovnA��Tka',
      specialization: 'PodvojnA� As�TtovnA�ctvo, daL�ovA� poradenstvo',
      experience: '15+ rokov skAssenostA�',
      education: 'EkonomickA? univerzita Bratislava',
      image: '/api/placeholder/150/150'
    },
    {
      name: 'Mgr. Peter NovA?k',
      position: 'DaL�ovA? poradca',
      specialization: 'DaL�ovA� priznania, optimalizA?cia danA�',
      experience: '12+ rokov skAssenostA�',
      education: 'PrA?vnickA? fakulta UK Bratislava',
      image: '/api/placeholder/150/150'
    },
    {
      name: 'Bc. Jana SvobodovA?',
      position: 'Mzdy a personalistika',
      specialization: 'Spracovanie miezd, personalistika',
      experience: '8+ rokov skAssenostA�',
      education: 'Fakulta podnikovA�ho hospodA?rstva',
      image: '/api/placeholder/150/150'
    }
  ];

  const values = [
    {
      title: 'TransparentnosLA',
      description: 'VL?etky naL?e sluLlby sAs transparentnA� s jasnA?mi cenami a podmienkami.',
      icon: ShieldCheckIcon
    },
    {
      title: 'Spo�lahlivosLA',
      description: 'Spo�lahli sme sa na presnosLA a v�TasnosLA vL?etkA?ch naL?ich sluLlieb.',
      icon: CheckCircleIcon
    },
    {
      title: 'DA�vernosLA Asdajov',
      description: 'VaL?e Asdaje sAs v bezpe�TA� s najvyL?L?ou AsrovL�ou ochrany a dA�vernosti.',
      icon: ShieldCheckIcon
    },
    {
      title: 'DlhodobA? spoluprA?ca',
      description: 'Budujeme dlhodobA� vzLAahy zaloLlenA� na dA�vere a kvalite sluLlieb.',
      icon: ClockIcon
    }
  ];

  const certifications = [
    {
      name: 'SKAU - SlovenskA? komora audA�torov',
      description: '�Slenstvo v profesijnej organizA?cii'
    },
    {
      name: 'DaL�ovA� poradenstvo',
      description: 'CertifikovanA? daL�ovA? poradca'
    },
    {
      name: 'ISO 27001',
      description: 'Bezpe�TnosLA informA?ciA�'
    },
    {
      name: 'GDPR Compliance',
      description: 'Ochrana osobnA?ch Asdajov'
    }
  ];

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              O naL?ej kancelA?rii
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Viac ako 20 rokov poskytujeme profesionA?lne As�TtovnA�ctvo a daL�ovA� poradenstvo. 
              NaL?a histAlria je zaloLlenA? na dA�vere, spo�lahlivosti a dlhodobej spoluprA?ci s klientmi.
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
                NaL?a histAlria a filozofia
              </h2>
              <div className="space-y-4 text-lg text-gray-600">
                <p>
                  NaL?a As�TtovnA�cka kancelA?ria vznikla v roku 2003 s cie�lom poskytovaLA 
                  kvalitnA� a spo�lahlivA� As�TtovnA�ctvo pre malA� a strednA� podniky.
                </p>
                <p>
                  Po�Tas viac ako 20 rokov sme si vybudovali silnAs pozA�ciu na trhu 
                  a zA�skali dA�veru stoviek spokojnA?ch klientov.
                </p>
                <p>
                  NaL?a filozofia je zaloLlenA? na princA�poch transparentnosti, 
                  spo�lahlivosti a dlhodobej spoluprA?ce. VerA�me, Lle Asspech naL?ich 
                  klientov je aj naL?A�m Asspechom.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">20+</div>
                  <div className="text-gray-600">Rokov skAssenostA�</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
                  <div className="text-gray-600">SpokojnA?ch klientov</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">15+</div>
                  <div className="text-gray-600">OdbornA�kov v tA�me</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
                  <div className="text-gray-600">Online prA�stup</div>
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
              NA?L? tA�m
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              SkAssenA� odbornA�ci s dlhoro�Tnou praxou v oblasti As�TtovnA�ctva a danA�
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
              NaL?e hodnoty a prA�stup
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              PrincA�py, ktorA� nA?s vedAs v kaLldej naL?ej prA?ci
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
              CertifikA?ty a �TlenstvA?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              NaL?e kvalifikA?cie a �TlenstvA? v profesijnA?ch organizA?ciA?ch
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
              Chcete sa dozvedieLA viac?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Kontaktujte nA?s a dohodneme si osobnA� stretnutie
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
              >
                KontaktovaLA nA?s
              </Link>
              <Link
                to="/services"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors"
              >
                NaL?e sluLlby
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;


