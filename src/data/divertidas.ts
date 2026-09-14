import type { Tutorial } from '../types';

export const DIVERTIDAS = [
  {
    id: 'estrella',
    name: 'Estrella',
    emoji: '⭐',
    category: 'divertidas',
    difficulty: 'facil',
    steps: [
      {
        d: 'M200,90 L227,155 L297,155 L241,196 L262,264 L200,222 L138,264 L159,196 L103,155 L173,155 Z',
      },
      { d: 'M330,100 L330,130 M315,115 L345,115 M70,280 L70,300 M60,290 L80,290' },
    ],
  },
  {
    id: 'corazon',
    name: 'Corazón',
    emoji: '❤️',
    category: 'divertidas',
    difficulty: 'facil',
    steps: [
      {
        d: 'M200,300 C120,240 90,190 90,150 C90,110 130,90 160,100 C180,107 195,125 200,140 C205,125 220,107 240,100 C270,90 310,110 310,150 C310,190 280,240 200,300 Z',
      },
      { d: 'M140,150 Q150,130 170,125' },
    ],
  },
  {
    id: 'globo',
    name: 'Globo',
    emoji: '🎈',
    category: 'divertidas',
    difficulty: 'facil',
    steps: [
      { d: 'M255,180 A65,75 0 1,1 145,180 A65,75 0 1,1 255,180' },
      { d: 'M192,253 L208,253 L200,265 Z M200,265 Q210,290 195,310 Q180,330 195,350' },
      { d: 'M165,150 Q160,135 175,130 Q185,140 178,155 Z' },
    ],
  },
  {
    id: 'regalo',
    name: 'Regalo',
    emoji: '🎁',
    category: 'divertidas',
    difficulty: 'facil',
    steps: [
      { d: 'M120,200 L280,200 L280,320 L120,320 Z' },
      { d: 'M185,200 L185,320 M120,245 L280,245' },
      {
        d: 'M200,200 Q160,160 140,180 Q150,205 200,200 Z M200,200 Q240,160 260,180 Q250,205 200,200 Z',
      },
    ],
  },
  {
    id: 'casa',
    name: 'Casa',
    emoji: '🏠',
    category: 'divertidas',
    difficulty: 'medio',
    steps: [
      { d: 'M120,220 L280,220 L280,340 L120,340 Z' },
      { d: 'M100,220 L200,130 L300,220 Z' },
      { d: 'M180,260 L220,260 L220,340 L180,340 Z' },
      { d: 'M135,240 L160,240 L160,265 L135,265 Z M240,240 L265,240 L265,265 L240,265 Z' },
      { d: 'M250,150 L270,150 L270,190 L250,190 Z M270,145 Q280,130 270,115 Q260,100 270,85' },
    ],
  },
  {
    id: 'torta',
    name: 'Torta de Cumpleaños',
    emoji: '🎂',
    category: 'divertidas',
    difficulty: 'medio',
    steps: [
      { d: 'M110,280 L290,280 L290,330 L110,330 Z' },
      { d: 'M150,230 L250,230 L250,280 L150,280 Z' },
      { d: 'M170,230 L170,205 M200,230 L200,200 M230,230 L230,205' },
      {
        d: 'M170,200 Q165,190 170,182 Q175,190 170,200 Z M200,195 Q195,185 200,177 Q205,185 200,195 Z M230,200 Q225,190 230,182 Q235,190 230,200 Z M130,300 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0 M270,300 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0 M170,255 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0 M230,255 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0',
      },
    ],
  },
] as const satisfies readonly Tutorial<'divertidas'>[];
