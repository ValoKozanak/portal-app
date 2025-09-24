import React, { useState } from 'react';
import { 
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    consultation: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Tu by sa odoslal formulA?r na server
    alert('�Zakujeme za vA?L? zA?ujem! Budeme vA?s kontaktovaLA v najbliLlL?om �Tase.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      message: '',
      consultation: false
    });
  };

  const contactInfo = [
    {
      title: 'Adresa kancelA?rie',
      content: 'HlavnA? 123, 811 01 Bratislava',
      icon: MapPinIcon
    },
    {
      title: 'TelefAln',
      content: '+421 123 456 789',
      icon: PhoneIcon
    },
    {
      title: 'Email',
      content: 'info@ucto.sk',
      icon: EnvelopeIcon
    },
    {
      title: 'AsradnA� hodiny',
      content: 'Pondelok - Piatok: 8:00 - 17:00',
      icon: ClockIcon
    }
  ];

  const services = [
    'PodvojnA� As�TtovnA�ctvo',
    'JednoduchA� As�TtovnA�ctvo',
    'Mzdy a personalistika',
    'DaL�ovA� poradenstvo',
    'KonsolidovanA� As�TtovnA�ctvo',
    'Audit a kontrola'
  ];

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              Kontaktujte nA?s
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              MA?te otA?zky alebo zA?ujem o naL?e sluLlby? NevA?hajte nA?s kontaktovaLA. 
              Radi vA?m pomA�Lleme a dohodneme si bezplatnAs konzultA?ciu.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Info Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                KontaktnA� informA?cie
              </h2>
              <div className="space-y-6">
                {contactInfo.map((info) => (
                  <div key={info.title} className="flex items-start">
                    <div className="bg-blue-600 rounded-full p-3 mr-4">
                      <info.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{info.title}</h3>
                      <p className="text-gray-600">{info.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Map Placeholder */}
              <div className="mt-8">
                <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center">
                    <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Google Maps - Bratislava</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                NapA�L?te nA?m
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Meno a priezvisko *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      TelefAln
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Firma
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    VaL?a sprA?va *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="OpA�L?te nA?m vaL?e potreby alebo otA?zky..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="consultation"
                    name="consultation"
                    checked={formData.consultation}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="consultation" className="ml-2 block text-sm text-gray-700">
                    MA?m zA?ujem o bezplatnAs konzultA?ciu
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  OdoslaLA sprA?vu
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              NaL?e sluLlby
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Poskytujeme kompletnA? servis v oblasti As�TtovnA�ctva a danA�
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service} className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <span className="font-semibold text-gray-900">{service}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Consultation CTA */}
      <div className="py-24 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            BezplatnA? konzultA?cia
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Dohodneme si osobnA� stretnutie a poradA�me vA?m s najlepL?A�m rieL?enA�m pre vaL?u firmu
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+421123456789"
              className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
            >
              ZavolaLA teraz
            </a>
            <a
              href="mailto:info@ucto.sk"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors"
            >
              NapA�saLA email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;


