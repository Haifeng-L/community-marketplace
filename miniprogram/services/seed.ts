import type { Category, Listing } from '../types/listing'

export const categories: Category[] = [
  { id: 'baby', name: '母婴用品', icon: '🍼' },
  { id: 'toy', name: '儿童玩具', icon: '🧸' },
  { id: 'book', name: '图书文具', icon: '📚' },
  { id: 'home', name: '家具家居', icon: '🪑' },
  { id: 'digital', name: '数码产品', icon: '💻' },
  { id: 'appliance', name: '大小家电', icon: '🔌' },
  { id: 'sports', name: '运动户外', icon: '🏸' },
  { id: 'free', name: '免费赠送', icon: '🎁' },
  { id: 'other', name: '其他', icon: '📦' },
]

export const seedListings: Listing[] = [
  {
    id: 'demo-1', title: '婴儿车', category: 'baby',
    description: '可坐可躺，可折叠，正常使用痕迹，适合小区内当面自提。',
    price: 55, originalPrice: 299, condition: '八成新', images: [],
    sellerName: '5-1/海丰', building: '5栋', contactType: 'groupName', contactValue: '5-1/海丰',
    negotiable: true, status: 'active', createdAt: '2026-08-20', expiresAt: '2026-09-19', views: 18,
  },
  {
    id: 'demo-2', title: '儿童摇摇马', category: 'toy',
    description: '二合一儿童玩具，摇摇马和滑行车两种玩法。',
    price: 10, condition: '七成新', images: [], sellerName: 'liangyueqing',
    contactType: 'groupName', contactValue: 'liangyueqing', negotiable: false,
    status: 'active', createdAt: '2026-08-19', expiresAt: '2026-09-18', views: 31,
  },
  {
    id: 'demo-3', title: '儿童汽车安全座椅', category: 'baby',
    description: '0—8岁可用，支持当面查看。', price: 790, condition: '九成新', images: [],
    sellerName: '6-2 想妈', building: '6栋', contactType: 'groupName', contactValue: '6-2 想妈',
    negotiable: true, status: 'active', createdAt: '2026-08-18', expiresAt: '2026-09-17', views: 45,
  },
]
