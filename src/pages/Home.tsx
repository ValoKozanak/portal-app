import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CalculatorIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const Home: React.FC = () => {
  const services = [
    {
      name: 'Podvojné účtovníctvo',
      description: 'Kompletné vedenie účtovníctva, spracovanie dokladov a reporting pre vašu firmu.',
      icon: CalculatorIcon,
      features: ['Vedenie účtovníctva', 'Spracovanie dokladov', 'Mesačné výkazy', 'Ročné zúčtovanie']
    },
    {
      name: 'Jednoduché účtovníctvo',
      description: 'Účtovníctvo pre SZČO a malé firmy s jednoduchým a prehľadným systémom.',
      icon: DocumentTextIcon,
      features: ['Jednoduché účtovníctvo', 'Daňové priznania', 'Online prístup', 'Osobné poradenstvo']
    },
    {
      name: 'Mzdy a personalistika',
      description: 'Spracovanie miezd, komunikácia so Sociálnou a zdravotnými poisťovňami.',
      icon: UserGroupIcon,
      features: ['Spracovanie miezd', 'Komunikácia s poisťovňami', 'Personalistika', 'Mzdy online']
    },
    {
      name: 'Daňové poradenstvo',
      description: 'Daňové priznania, optimalizácia a poradenstvo v oblasti daní.',
      icon: ChartBarIcon,
      features: ['Daňové priznania', 'Optimalizácia daní', 'Poradenstvo', 'Legislatívne zmeny']
    }
  ];

  const benefits = [
    {
      title: 'Online prístup',
      description: '24/7 prístup k vašim dokladom a výkazom cez bezpečný klientský portál.',
      icon: ShieldCheckIcon
    },
    {
      title: 'Komunikácia s účtovníkom',
      description: 'Priama komunikácia s vaším účtovníkom cez portál alebo telefonicky.',
      icon: PhoneIcon
    },
    {
      title: 'Bezpečný prenos dokumentov',
      description: 'Bezpečné nahrávanie a prenos dokumentov s najvyššou úrovňou ochrany.',
      icon: ShieldCheckIcon
    },
    {
      title: 'Rýchle spracovanie',
      description: 'Rýchle spracovanie vašich dokladov s garantovanými termínmi.',
      icon: ClockIcon
    }
  ];

  const testimonials = [
    {
      name: 'Peter Novák',
      company: 'Novák s.r.o.',
      text: 'Profesionálny prístup a rýchle spracovanie. Odporúčam všetkým podnikateľom.',
      rating: 5
    },
    {
      name: 'Mária Kováčová',
      company: 'Kováčová Consulting',
      text: 'Výborná komunikácia a online prístup k dokladom. Ušetrili sme veľa času.',
      rating: 5
    },
    {
      name: 'Ján Svoboda',
      company: 'Svoboda Trading',
      text: 'Spoľahlivé účtovníctvo a daňové poradenstvo. Dlhodobá spolupráca.',
      rating: 5
    }
  ];

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-white p-4 rounded-full">
                <CalculatorIcon className="h-16 w-16 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              Vaše účtovníctvo –{' '}
              <span className="text-yellow-300">naša starosť</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-10">
              Profesionálne účtovníctvo a daňové poradenstvo pre vašu firmu. 
              Poskytujeme kompletný servis s dôrazom na spoľahlivosť, presnosť a moderné riešenia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
              >
                Stať sa klientom
              </Link>
              <Link
                to="/contact"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors"
              >
                Kontaktovať účtovníka
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Naše služby
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Poskytujeme kompletný servis v oblasti účtovníctva, miezd a daňového poradenstva
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service) => (
              <div key={service.name} className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <service.icon className="h-8 w-8 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                </div>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm text-gray-600">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
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
              Prečo si vybrať nás?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Moderné riešenia a profesionálny prístup pre vašu firmu
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

      {/* Testimonials Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Čo hovoria naši klienti
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Spokojnosť našich klientov je naša najväčšia odmena
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.company}</p>
                </div>
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
                to="/login"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors"
              >
                Prihlásiť sa do portálu
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

