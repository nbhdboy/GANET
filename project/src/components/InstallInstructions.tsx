import React from 'react';
import { ArrowLeft, Smartphone, Settings, Wifi } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';

interface InstallInstructionsProps {
  onBack: () => void;
}

export function InstallInstructions({ onBack }: InstallInstructionsProps) {
  const { language } = useStore();
  const t = translations[language];

  const steps = [
    {
      icon: <Settings size={24} />,
      title: t.step1Title,
      description: t.step1Desc,
      image: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?auto=format&fit=crop&w=800&q=80',
      additionalImages: [
        'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1611162616305-c69b3037f77d?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      icon: <Smartphone size={24} />,
      title: t.step2Title,
      description: t.step2Desc,
      image: 'https://images.unsplash.com/photo-1621330396173-e41b1cafd17f?auto=format&fit=crop&w=800&q=80',
      additionalImages: [
        'https://images.unsplash.com/photo-1621330396461-dc4f53d86c1f?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      icon: <Wifi size={24} />,
      title: t.step3Title,
      description: t.step3Desc,
      image: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=800&q=80',
      additionalImages: [
        'https://images.unsplash.com/photo-1557682260-96773eb01377?auto=format&fit=crop&w=800&q=80'
      ]
    },
  ];

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="bg-line-gradient text-white sticky top-0">
        <div className="container mx-auto px-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 py-4"
          >
            <ArrowLeft size={20} />
            {t.back}
          </button>
          <h1 className="text-2xl font-bold pb-6">{t.installInstructions}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-line/10 rounded-full flex items-center justify-center">
                    <div className="text-line">{step.icon}</div>
                  </div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{step.description}</p>
                <div className="space-y-4">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full rounded-lg shadow-md"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    {step.additionalImages?.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`${step.title} - Additional ${i + 1}`}
                        className="w-full rounded-lg shadow-md"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}