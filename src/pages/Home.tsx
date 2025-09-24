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
      name: 'PodvojnA? As?TtovnA?ctvo',
      description: 'KompletnA? vedenie As?TtovnA?ctva, spracovanie dokladov a reporting pre vaL?u firmu.',
      icon: CalculatorIcon,
      features: ['Vedenie As?TtovnA?ctva', 'Spracovanie dokladov', 'Mesa?TnA? vA?kazy', 'Ro?TnA? zAs?Ttovanie']
    },
    {
      name: 'JednoduchA? As?TtovnA?ctvo',
      description: 'As?TtovnA?ctvo pre SZ?SO a malA? firmy s jednoduchA?m a preh?ladnA?m systA?mom.',
      icon: DocumentTextIcon,
      features: ['JednoduchA? As?TtovnA?ctvo', 'DaL?ovA? priznania', 'Online prA?stup', 'OsobnA? poradenstvo']
    },
    {
      name: 'Mzdy a personalistika',
      description: 'Spracovanie miezd, komunikA?cia so SociA?lnou a zdravotnA?mi poisLAovL?ami.',
      icon: UserGroupIcon,
      features: ['Spracovanie miezd', 'KomunikA?cia s poisLAovL?ami', 'Personalistika', 'Mzdy online']
    },
    {
      name: 'DaL?ovA? poradenstvo',
      description: 'DaL?ovA? priznania, optimalizA?cia a poradenstvo v oblasti danA?.',
      icon: ChartBarIcon,
      features: ['DaL?ovA? priznania', 'OptimalizA?cia danA?', 'Poradenstvo', 'LegislatA?vne zmeny']
    }
  ];

  const benefits = [
    {
      title: 'Online prA?stup',
      description: '24/7 prA?stup k vaL?im dokladom a vA?kazom cez bezpe?TnA? klientskA? portA?l.',
      icon: ShieldCheckIcon
    },
    {
      title: 'KomunikA?cia s As?TtovnA?kom',
      description: 'Priama komunikA?cia s vaL?A?m As?TtovnA?kom cez portA?l alebo telefonicky.',
      icon: PhoneIcon
    },
    {
      title: 'Bezpe?TnA? prenos dokumentov',
      description: 'Bezpe?TnA? nahrA?vanie a prenos dokumentov s najvyL?L?ou AsrovL?ou ochrany.',
      icon: ShieldCheckIcon
    },
    {
      title: 'RA?chle spracovanie',
      description: 'RA?chle spracovanie vaL?ich dokladov s garantovanA?mi termA?nmi.',
      icon: ClockIcon
    }
  ];

  const testimonials = [
    {
      name: 'Peter NovA?k',
      company: 'NovA?k s.r.o.',
      text: 'ProfesionA?lny prA?stup a rA?chle spracovanie. OdporAs?Tam vL?etkA?m podnikate?lom.',
      rating: 5
    },
    {
      name: 'MA?ria KovA??TovA?',
      company: 'KovA??TovA? Consulting',
      text: 'VA?bornA? komunikA?cia a online prA?stup k dokladom. UL?etrili sme ve?la ?Tasu.',
      rating: 5
    },
    {
      name: 'JA?n Svoboda',
      company: 'Svoboda Trading',
      text: 'Spo?lahlivA? As?TtovnA?ctvo a daL?ovA? poradenstvo. DlhodobA? spoluprA?ca.',
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
              VaL?e As?TtovnA?ctvo ??"{' '}
              <span className="text-yellow-300">naL?a starosLA</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-10">
              ProfesionA?lne As?TtovnA?ctvo a daL?ovA? poradenstvo pre vaL?u firmu. 
              Poskytujeme kompletnA? servis s dA?razom na spo?lahlivosLA, presnosLA a modernA? rieL?enia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
              >
                StaLA sa klientom
              </Link>
              <Link
                to="/contact"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors"
              >
                KontaktovaLA As?TtovnA?ka
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
              NaL?e sluLlby
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Poskytujeme kompletnA? servis v oblasti As?TtovnA?ctva, miezd a daL?ovA?ho poradenstva
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
              Pre?To si vybraLA nA?s?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ModernA? rieL?enia a profesionA?lny prA?stup pre vaL?u firmu
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
              ?So hovoria naL?i klienti
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              SpokojnosLA naL?ich klientov je naL?a najvA??TL?ia odmena
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
                to="/login"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors"
              >
                PrihlA?siLA sa do portA?lu
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;


