import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDownIcon,
  ChevronUpIcon,
  QuestionMarkCircleIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const FAQ: React.FC = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

  const faqs = [
    {
      question: 'Ako odovzdávať doklady?',
      answer: 'Doklady môžete odovzdávať niekoľkými spôsobmi: 1) Cez klientský portál - bezpečné nahrávanie faktúr a dokladov, 2) Emailom - pošlite nám doklady na náš email, 3) Osobne - môžete nám doklady priniesť do kancelárie. Najrýchlejší a najbezpečnejší spôsob je cez náš klientský portál.'
    },
    {
      question: 'Koľko stojí spracovanie účtovníctva?',
      answer: 'Ceny sa líšia podľa typu služby a veľkosti firmy. Jednoduché účtovníctvo pre SZČO stojí od 80€/mesiac, podvojné účtovníctvo od 150€/mesiac, mzdy od 15€/zamestnanec. Presnú cenu vám vypočítame po bezplatnej konzultácii vašich potrieb.'
    },
    {
      question: 'Aké sú termíny pre daňové priznania?',
      answer: 'Termíny pre daňové priznania sa líšia podľa typu: DPFO (daň z príjmov fyzických osôb) - do 31.3. nasledujúceho roku, DPH (daň z pridanej hodnoty) - mesačné alebo štvrťročné podľa obratu, daň z príjmov právnických osôb - do 31.3. nasledujúceho roku. Všetky termíny vám pripomenieme v dostatočnom predstihu.'
    },
    {
      question: 'Ako funguje online komunikácia?',
      answer: 'Online komunikácia prebieha cez náš bezpečný klientský portál. Môžete nám posielať správy, nahrávať doklady, sledovať stav spracovania a komunikovať s vaším účtovníkom. Portál je dostupný 24/7 a všetky údaje sú chránené najvyššou úrovňou bezpečnosti.'
    },
    {
      question: 'Môžem zmeniť účtovníka?',
      answer: 'Áno, môžete zmeniť účtovníka kedykoľvek. Proces je jednoduchý - stačí nás kontaktovať a dohodneme si prechod na nového účtovníka. Všetky vaše údaje a doklady zostanú v bezpečí a budú prenesené k novému účtovníkovi.'
    },
    {
      question: 'Ako dlho trvá spracovanie dokladov?',
      answer: 'Štandardne spracovávame doklady do 3-5 pracovných dní. Pri urgentných príležitostiach môžeme spracovanie urýchliť. Všetky termíny sú dohodnuté vopred a dodržiavame ich. O stave spracovania vás informujeme cez portál.'
    },
    {
      question: 'Poskytujete poradenstvo pri daňových otázkach?',
      answer: 'Áno, poskytujeme komplexné daňové poradenstvo. Naši daňoví poradcovia vám pomôžu s optimalizáciou daňového zaťaženia, daňovým plánovaním, riešením daňových otázok a sledovaním legislatívnych zmien. Poradenstvo je súčasťou našich služieb.'
    },
    {
      question: 'Ako zabezpečujete bezpečnosť údajov?',
      answer: 'Bezpečnosť vašich údajov je naša priorita. Používame najnovšie technológie šifrovania, máme certifikáty ISO 27001 pre bezpečnosť informácií, dodržiavame GDPR a máme prísne interné postupy na ochranu údajov. Všetky údaje sú uložené na bezpečných serveroch.'
    },
    {
      question: 'Môžem pristupovať k mojim dokladom online?',
      answer: 'Áno, cez náš klientský portál máte 24/7 prístup k všetkým vašim dokladom, výkazom a správam. Môžete si ich prezeráť, sťahovať a tlačiť kedykoľvek potrebujete. Portál je dostupný z počítača aj mobilného zariadenia.'
    },
    {
      question: 'Ako začať spoluprácu?',
      answer: 'Začiatok spolupráce je jednoduchý: 1) Kontaktujte nás telefonicky alebo emailom, 2) Dohodneme si bezplatnú konzultáciu, 3) Podpíšeme zmluvu o spolupráci, 4) Vytvoríme vám prístup do klientského portálu, 5) Začneme spracovávať vaše doklady.'
    }
  ];

  const categories = [
    {
      title: 'Všeobecné otázky',
      questions: [0, 1, 9]
    },
    {
      title: 'Doklady a spracovanie',
      questions: [0, 5, 8]
    },
    {
      title: 'Ceny a platby',
      questions: [1]
    },
    {
      title: 'Daňové otázky',
      questions: [2, 6]
    },
    {
      title: 'Technické otázky',
      questions: [3, 7]
    },
    {
      title: 'Spolupráca',
      questions: [4]
    }
  ];

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              Často kladené otázky
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Odpovede na najčastejšie otázky našich klientov. 
              Ak nenájdete odpoveď, neváhajte nás kontaktovať.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <QuestionMarkCircleIcon className="h-6 w-6 text-blue-600 mr-3" />
                    <span className="text-lg font-semibold text-gray-900">{faq.question}</span>
                  </div>
                  {openItems.includes(index) ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {openItems.includes(index) && (
                  <div className="px-6 pb-4">
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Otázky podľa kategórií
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Nájdite rýchlo odpoveď na vašu otázku
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{category.title}</h3>
                <ul className="space-y-2">
                  {category.questions.map((questionIndex) => (
                    <li key={questionIndex}>
                      <button
                        onClick={() => toggleItem(questionIndex)}
                        className="text-blue-600 hover:text-blue-800 text-left"
                      >
                        {faqs[questionIndex].question}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Nenašli ste odpoveď?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Ak ste nenašli odpoveď na vašu otázku, neváhajte nás kontaktovať. 
            Naši odborníci vám radi pomôžu.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <PhoneIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Telefonicky</h3>
              <p className="text-gray-600 mb-4">Zavolajte nám a dohodneme si konzultáciu</p>
              <a href="tel:+421123456789" className="text-blue-600 font-semibold hover:text-blue-800">
                +421 123 456 789
              </a>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <EnvelopeIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Emailom</h3>
              <p className="text-gray-600 mb-4">Napíšte nám a odpovieme vám do 24 hodín</p>
              <a href="mailto:info@ucto.sk" className="text-blue-600 font-semibold hover:text-blue-800">
                info@ucto.sk
              </a>
            </div>
          </div>
          
          <div className="mt-12">
            <Link
              to="/contact"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Kontaktovať nás
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
