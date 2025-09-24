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
      question: 'Ako odovzdA?vaLA doklady?',
      answer: 'Doklady mA?Llete odovzdA?vaLA nieko?lkA?mi spA?sobmi: 1) Cez klientskA? portA?l - bezpe?TnA? nahrA?vanie faktAsr a dokladov, 2) Emailom - poL?lite nA?m doklady na nA?L? email, 3) Osobne - mA?Llete nA?m doklady priniesLA do kancelA?rie. NajrA?chlejL?A? a najbezpe?TnejL?A? spA?sob je cez nA?L? klientskA? portA?l.'
    },
    {
      question: 'Ko?lko stojA? spracovanie As?TtovnA?ctva?',
      answer: 'Ceny sa lA?L?ia pod?la typu sluLlby a ve?lkosti firmy. JednoduchA? As?TtovnA?ctvo pre SZ?SO stojA? od 80?,?/mesiac, podvojnA? As?TtovnA?ctvo od 150?,?/mesiac, mzdy od 15?,?/zamestnanec. PresnAs cenu vA?m vypo?TA?tame po bezplatnej konzultA?cii vaL?ich potrieb.'
    },
    {
      question: 'AkA? sAs termA?ny pre daL?ovA? priznania?',
      answer: 'TermA?ny pre daL?ovA? priznania sa lA?L?ia pod?la typu: DPFO (daL? z prA?jmov fyzickA?ch osA?b) - do 31.3. nasledujAsceho roku, DPH (daL? z pridanej hodnoty) - mesa?TnA? alebo L?tvrLAro?TnA? pod?la obratu, daL? z prA?jmov prA?vnickA?ch osA?b - do 31.3. nasledujAsceho roku. VL?etky termA?ny vA?m pripomenieme v dostato?Tnom predstihu.'
    },
    {
      question: 'Ako funguje online komunikA?cia?',
      answer: 'Online komunikA?cia prebieha cez nA?L? bezpe?TnA? klientskA? portA?l. MA?Llete nA?m posielaLA sprA?vy, nahrA?vaLA doklady, sledovaLA stav spracovania a komunikovaLA s vaL?A?m As?TtovnA?kom. PortA?l je dostupnA? 24/7 a vL?etky Asdaje sAs chrA?nenA? najvyL?L?ou AsrovL?ou bezpe?Tnosti.'
    },
    {
      question: 'MA?Llem zmeniLA As?TtovnA?ka?',
      answer: 'A?no, mA?Llete zmeniLA As?TtovnA?ka kedyko?lvek. Proces je jednoduchA? - sta?TA? nA?s kontaktovaLA a dohodneme si prechod na novA?ho As?TtovnA?ka. VL?etky vaL?e Asdaje a doklady zostanAs v bezpe?TA? a budAs prenesenA? k novA?mu As?TtovnA?kovi.'
    },
    {
      question: 'Ako dlho trvA? spracovanie dokladov?',
      answer: 'L?tandardne spracovA?vame doklady do 3-5 pracovnA?ch dnA?. Pri urgentnA?ch prA?leLlitostiach mA?Lleme spracovanie urA?chliLA. VL?etky termA?ny sAs dohodnutA? vopred a dodrLliavame ich. O stave spracovania vA?s informujeme cez portA?l.'
    },
    {
      question: 'Poskytujete poradenstvo pri daL?ovA?ch otA?zkach?',
      answer: 'A?no, poskytujeme komplexnA? daL?ovA? poradenstvo. NaL?i daL?ovA? poradcovia vA?m pomA?Llu s optimalizA?ciou daL?ovA?ho zaLAaLlenia, daL?ovA?m plA?novanA?m, rieL?enA?m daL?ovA?ch otA?zok a sledovanA?m legislatA?vnych zmien. Poradenstvo je sAs?TasLAou naL?ich sluLlieb.'
    },
    {
      question: 'Ako zabezpe?Tujete bezpe?TnosLA Asdajov?',
      answer: 'Bezpe?TnosLA vaL?ich Asdajov je naL?a priorita. PouLlA?vame najnovL?ie technolAlgie L?ifrovania, mA?me certifikA?ty ISO 27001 pre bezpe?TnosLA informA?ciA?, dodrLliavame GDPR a mA?me prA?sne internA? postupy na ochranu Asdajov. VL?etky Asdaje sAs uloLlenA? na bezpe?TnA?ch serveroch.'
    },
    {
      question: 'MA?Llem pristupovaLA k mojim dokladom online?',
      answer: 'A?no, cez nA?L? klientskA? portA?l mA?te 24/7 prA?stup k vL?etkA?m vaL?im dokladom, vA?kazom a sprA?vam. MA?Llete si ich prezerA?LA, sLAahovaLA a tla?TiLA kedyko?lvek potrebujete. PortA?l je dostupnA? z po?TA?ta?Ta aj mobilnA?ho zariadenia.'
    },
    {
      question: 'Ako za?TaLA spoluprA?cu?',
      answer: 'Za?Tiatok spoluprA?ce je jednoduchA?: 1) Kontaktujte nA?s telefonicky alebo emailom, 2) Dohodneme si bezplatnAs konzultA?ciu, 3) PodpA?L?eme zmluvu o spoluprA?ci, 4) VytvorA?me vA?m prA?stup do klientskA?ho portA?lu, 5) Za?Tneme spracovA?vaLA vaL?e doklady.'
    }
  ];

  const categories = [
    {
      title: 'VL?eobecnA? otA?zky',
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
      title: 'DaL?ovA? otA?zky',
      questions: [2, 6]
    },
    {
      title: 'TechnickA? otA?zky',
      questions: [3, 7]
    },
    {
      title: 'SpoluprA?ca',
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
              ?Sasto kladenA? otA?zky
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Odpovede na naj?TastejL?ie otA?zky naL?ich klientov. 
              Ak nenA?jdete odpove?Z, nevA?hajte nA?s kontaktovaLA.
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
              OtA?zky pod?la kategAlriA?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              NA?jdite rA?chlo odpove?Z na vaL?u otA?zku
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
            NenaL?li ste odpove?Z?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Ak ste nenaL?li odpove?Z na vaL?u otA?zku, nevA?hajte nA?s kontaktovaLA. 
            NaL?i odbornA?ci vA?m radi pomA?Llu.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <PhoneIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Telefonicky</h3>
              <p className="text-gray-600 mb-4">Zavolajte nA?m a dohodneme si konzultA?ciu</p>
              <a href="tel:+421123456789" className="text-blue-600 font-semibold hover:text-blue-800">
                +421 123 456 789
              </a>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <EnvelopeIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Emailom</h3>
              <p className="text-gray-600 mb-4">NapA?L?te nA?m a odpovieme vA?m do 24 hodA?n</p>
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
              KontaktovaLA nA?s
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;

