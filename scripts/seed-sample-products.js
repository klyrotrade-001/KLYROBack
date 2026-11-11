const mongoose = require('mongoose');
const Product = require('../models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://klyrotrade_db_user:9srk3K9ytAgrqZk4@klyro.nvq3f9z.mongodb.net/klyro';

const sampleProducts = [
  {
    id: 'prod-1794374027711',
    slug: 'mini-portable-nebulizer-1794374027711',
    name: 'Mini Portable Nebulizer',
    category: 'Mini Nebulizers',
    categorySlug: 'mini-nebulizers',
    price: 2999,
    originalPrice: 4999,
    discount: 40,
    description: 'Compact and efficient portable nebulizer for on-the-go respiratory care',
    fullDescription: 'This mini portable nebulizer is perfect for travel and daily use. Features silent operation, USB rechargeable battery, and medical-grade components.',
    features: [
      'USB Rechargeable',
      'Silent Operation',
      'Medical Grade',
      'Portable & Compact',
      'Easy to Clean'
    ],
    specs: {
      'Battery Life': '2-3 hours',
      'Charging Time': '1 hour',
      'Weight': '120g',
      'Dimensions': '6cm x 4cm x 8cm'
    },
    images: ['/products/nebulizer-1.jpg'],
    variants: [],
    inStock: true,
    rating: 4.5,
    reviewsCount: 128,
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true
  },
  {
    id: 'prod-1794374027712',
    slug: 'wireless-bluetooth-earbuds-1794374027712',
    name: 'Wireless Bluetooth Earbuds',
    category: 'Mini Electronics',
    categorySlug: 'mini-electronics',
    price: 1499,
    originalPrice: 2999,
    discount: 50,
    description: 'High-quality wireless earbuds with active noise cancellation',
    fullDescription: 'Premium wireless earbuds featuring crystal-clear sound, touch controls, and all-day battery life.',
    features: [
      'Active Noise Cancellation',
      'Touch Controls',
      '24-Hour Battery Life',
      'IPX7 Waterproof',
      'Premium Sound Quality'
    ],
    specs: {
      'Battery Life': '6 hours (earbuds) + 18 hours (case)',
      'Bluetooth': '5.2',
      'Driver Size': '10mm',
      'Water Resistance': 'IPX7'
    },
    images: ['/products/earbuds-1.jpg'],
    variants: [
      { name: 'Color', options: ['Black', 'White', 'Blue'] }
    ],
    inStock: true,
    rating: 4.3,
    reviewsCount: 256,
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: true
  },
  {
    id: 'prod-1794374027713',
    slug: 'smart-baby-monitor-1794374027713',
    name: 'Smart Baby Monitor with Camera',
    category: 'Baby Products & Toys',
    categorySlug: 'baby-products-toys',
    price: 3999,
    originalPrice: 6999,
    discount: 43,
    description: 'HD baby monitor with night vision, two-way audio, and temperature sensor',
    fullDescription: 'Keep an eye on your baby with this advanced smart monitor featuring HD video, night vision, and smartphone connectivity.',
    features: [
      'HD 1080p Camera',
      'Night Vision',
      'Two-Way Audio',
      'Temperature Sensor',
      'Motion Detection',
      'App Control'
    ],
    specs: {
      'Resolution': '1080p',
      'Range': '300m',
      'Battery': 'Rechargeable Li-ion',
      'Connectivity': 'WiFi + Bluetooth'
    },
    images: ['/products/baby-monitor-1.jpg'],
    variants: [],
    inStock: true,
    rating: 4.7,
    reviewsCount: 89,
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: true
  },
  {
    id: 'prod-1794374027714',
    slug: 'mini-electric-screwdriver-kit-1794374027714',
    name: 'Mini Electric Screwdriver Kit',
    category: 'Tools',
    categorySlug: 'tools',
    price: 1999,
    originalPrice: 3499,
    discount: 43,
    description: 'Cordless electric screwdriver with 12 precision bits',
    fullDescription: 'Professional-grade mini electric screwdriver perfect for electronics repair, DIY projects, and household tasks.',
    features: [
      '12 Precision Bits',
      'USB Rechargeable',
      'LED Work Light',
      'Forward/Reverse',
      'Ergonomic Grip',
      'Storage Case Included'
    ],
    specs: {
      'Torque': '3 N.m',
      'Speed': '200 RPM',
      'Battery': '1500mAh',
      'Charging Time': '2 hours'
    },
    images: ['/products/screwdriver-1.jpg'],
    variants: [],
    inStock: true,
    rating: 4.6,
    reviewsCount: 342,
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: false
  },
  {
    id: 'prod-1794374027715',
    slug: 'mini-rice-cooker-1794374027715',
    name: 'Mini Rice Cooker 1.5L',
    category: 'Kitchen Items',
    categorySlug: 'kitchen-items',
    price: 2499,
    originalPrice: 3999,
    discount: 38,
    description: 'Compact rice cooker perfect for 1-2 people with keep-warm function',
    fullDescription: 'Space-saving mini rice cooker with non-stick pot, automatic keep-warm, and easy one-touch operation.',
    features: [
      '1.5L Capacity',
      'Non-Stick Inner Pot',
      'Auto Keep Warm',
      'One-Touch Operation',
      'Easy to Clean',
      'Compact Design'
    ],
    specs: {
      'Capacity': '1.5 Liters',
      'Power': '300W',
      'Cooking Time': '20-30 minutes',
      'Dimensions': '18cm x 18cm x 22cm'
    },
    images: ['/products/rice-cooker-1.jpg'],
    variants: [
      { name: 'Color', options: ['White', 'Pink', 'Blue'] }
    ],
    inStock: true,
    rating: 4.4,
    reviewsCount: 167,
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false
  }
];

async function seedProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    const count = await Product.countDocuments();
    if (count > 0) {
      console.log(`⚠️  Found ${count} existing products. Clearing...`);
      await Product.deleteMany({});
    }

    // Insert sample products
    await Product.insertMany(sampleProducts);
    console.log(`✅ Seeded ${sampleProducts.length} sample products into MongoDB`);
    
    // Show products
    const products = await Product.find().select('id name slug category price').lean();
    console.log('\n📋 Products in MongoDB:');
    products.forEach(p => {
      console.log(`  ✓ ${p.id}`);
      console.log(`    Name: ${p.name}`);
      console.log(`    Slug: ${p.slug}`);
      console.log(`    Category: ${p.category}`);
      console.log(`    Price: ₹${p.price}`);
      console.log('');
    });

    await mongoose.connection.close();
    console.log('✅ Done! Products ready for testing.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedProducts();
