const mongoose = require('mongoose');
const Review = require('../models/Review');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://klyrotrade_db_user:9srk3K9ytAgrqZk4@klyro.nvq3f9z.mongodb.net/klyro';

const sampleReviews = [
  {
    id: 'rev-1794374027801',
    productId: 'prod-1794374027711',
    productSlug: 'mini-portable-nebulizer-1794374027711',
    productName: 'Mini Portable Nebulizer',
    customerName: 'Priya Sharma',
    rating: 5,
    comment: 'Excellent product! Very portable and easy to use. Perfect for my elderly parents. The battery life is great and it\'s so quiet. Highly recommend!',
    variant: '',
    verified: true,
    helpful: 15,
    status: 'approved',
    createdAt: new Date('2026-10-15').toISOString(),
  },
  {
    id: 'rev-1794374027802',
    productId: 'prod-1794374027711',
    productSlug: 'mini-portable-nebulizer-1794374027711',
    productName: 'Mini Portable Nebulizer',
    customerName: 'Rajesh Kumar',
    rating: 4,
    comment: 'Good quality nebulizer. Works well and charges quickly. Only downside is the cup could be a bit larger. Overall satisfied with the purchase.',
    variant: '',
    verified: true,
    helpful: 8,
    status: 'approved',
    createdAt: new Date('2026-10-20').toISOString(),
  },
  {
    id: 'rev-1794374027803',
    productId: 'prod-1794374027712',
    productSlug: 'wireless-bluetooth-earbuds-1794374027712',
    productName: 'Wireless Bluetooth Earbuds',
    customerName: 'Anjali Patel',
    rating: 5,
    comment: 'Amazing sound quality! The noise cancellation is fantastic. Very comfortable for long hours of use. Best earbuds I\'ve owned!',
    variant: 'Black',
    verified: true,
    helpful: 22,
    status: 'approved',
    createdAt: new Date('2026-10-18').toISOString(),
  },
  {
    id: 'rev-1794374027804',
    productId: 'prod-1794374027712',
    productSlug: 'wireless-bluetooth-earbuds-1794374027712',
    productName: 'Wireless Bluetooth Earbuds',
    customerName: 'Vikram Singh',
    rating: 4,
    comment: 'Great value for money. Sound is clear and bass is good. Touch controls take some getting used to but overall very happy.',
    variant: 'White',
    verified: false,
    helpful: 5,
    status: 'approved',
    createdAt: new Date('2026-10-22').toISOString(),
  },
  {
    id: 'rev-1794374027805',
    productId: 'prod-1794374027713',
    productSlug: 'smart-baby-monitor-1794374027713',
    productName: 'Smart Baby Monitor with Camera',
    customerName: 'Meera Reddy',
    rating: 5,
    comment: 'This baby monitor is a lifesaver! The app is easy to use and the night vision is crystal clear. Love the temperature sensor feature. Worth every rupee!',
    variant: '',
    verified: true,
    helpful: 18,
    status: 'approved',
    createdAt: new Date('2026-10-12').toISOString(),
  },
  {
    id: 'rev-1794374027806',
    productId: 'prod-1794374027714',
    productSlug: 'mini-electric-screwdriver-kit-1794374027714',
    productName: 'Mini Electric Screwdriver Kit',
    customerName: 'Amit Verma',
    rating: 5,
    comment: 'Perfect for small electronics repair! The precision bits are high quality and the LED light is very helpful. Charges via USB which is convenient.',
    variant: '',
    verified: true,
    helpful: 12,
    status: 'approved',
    createdAt: new Date('2026-10-16').toISOString(),
  },
  {
    id: 'rev-1794374027807',
    productId: 'prod-1794374027715',
    productSlug: 'mini-rice-cooker-1794374027715',
    productName: 'Mini Rice Cooker 1.5L',
    customerName: 'Sonia Das',
    rating: 4,
    comment: 'Compact and cooks rice perfectly. Great for my small apartment. Keep warm function is useful. Only wish it had a steamer basket too.',
    variant: 'White',
    verified: false,
    helpful: 7,
    status: 'approved',
    createdAt: new Date('2026-10-25').toISOString(),
  },
];

async function seedReviews() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const count = await Review.countDocuments();
    console.log(`📝 Current reviews in MongoDB: ${count}`);

    if (count > 0) {
      console.log('⚠️  Reviews already exist. Clearing...');
      await Review.deleteMany({});
    }

    await Review.insertMany(sampleReviews);
    console.log(`✅ Seeded ${sampleReviews.length} sample reviews into MongoDB`);
    
    // Show summary by product
    const products = await Review.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$productName',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Reviews by product:');
    products.forEach(p => {
      console.log(`  ${p._id}: ${p.count} reviews (avg: ${p.avgRating.toFixed(1)} ⭐)`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Done! Reviews ready for testing.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedReviews();
