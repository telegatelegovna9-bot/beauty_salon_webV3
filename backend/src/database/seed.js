const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { initDb } = require('./db');

async function main() {
  console.log('🌱 Seeding database...');
  const db = await initDb();

  // Seed categories
  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (key, name, emoji, sort_order)
    VALUES (?, ?, ?, ?)
  `);

  const categories = [
    ['manicure', 'Маникюр', '💅', 1],
    ['pedicure', 'Педикюр', '🦶', 2],
    ['eyebrows', 'Брови', '👁️', 3],
    ['eyelashes', 'Ресницы', '👁️‍🗨️', 4],
    ['other', 'Другое', '🔧', 5],
  ];

  const seedCategories = db.transaction(() => {
    categories.forEach(c => insertCategory.run(...c));
  });
  seedCategories();
  console.log(`✅ Seeded ${categories.length} categories`);

  const insertService = db.prepare(`
    INSERT OR IGNORE INTO services (name, description, category, category_id, duration_minutes, price, price_max, sort_order)
    VALUES (?, ?, ?, (SELECT id FROM categories WHERE key = ?), ?, ?, ?, ?)
  `);

  const services = [
    ['Классический маникюр', 'Обработка ногтей, кутикулы и покрытие лаком', 'manicure', 'manicure', 60, 1200, null, 1],
    ['Аппаратный маникюр', 'Маникюр с использованием аппарата', 'manicure', 'manicure', 75, 1500, null, 2],
    ['Маникюр с гель-лаком', 'Покрытие гель-лаком с долгосрочным эффектом', 'manicure', 'manicure', 90, 2000, 2500, 3],
    ['Наращивание ногтей', 'Наращивание на типсы или формы', 'manicure', 'manicure', 150, 3500, 4500, 4],
    ['Дизайн ногтей', 'Художественный дизайн, стразы, фольга', 'manicure', 'manicure', 30, 500, 1500, 5],
    ['Классический педикюр', 'Обработка стоп и ногтей', 'pedicure', 'pedicure', 90, 1800, null, 6],
    ['Аппаратный педикюр', 'Педикюр с использованием аппарата', 'pedicure', 'pedicure', 90, 2000, null, 7],
    ['Педикюр с гель-лаком', 'Покрытие гель-лаком на ногти ног', 'pedicure', 'pedicure', 120, 2500, 3000, 8],
    ['SPA-педикюр', 'Расслабляющий педикюр с ванночкой и маской', 'pedicure', 'pedicure', 120, 3000, null, 9],
    ['Коррекция бровей', 'Придание формы бровям', 'eyebrows', 'eyebrows', 30, 800, null, 10],
    ['Окрашивание бровей', 'Окрашивание хной или краской', 'eyebrows', 'eyebrows', 45, 1000, null, 11],
    ['Ламинирование бровей', 'Долгосрочная укладка бровей', 'eyebrows', 'eyebrows', 60, 2500, null, 12],
    ['Архитектура бровей', 'Полная работа с формой и цветом', 'eyebrows', 'eyebrows', 90, 3000, null, 13],
    ['Классическое наращивание ресниц', 'Наращивание 1:1', 'eyelashes', 'eyelashes', 120, 3000, null, 14],
    ['2D/3D наращивание ресниц', 'Объёмное наращивание', 'eyelashes', 'eyelashes', 150, 4000, 5000, 15],
    ['Ламинирование ресниц', 'Долгосрочный завиток ресниц', 'eyelashes', 'eyelashes', 90, 2500, null, 16],
    ['Коррекция ресниц', 'Заполнение выпавших ресниц', 'eyelashes', 'eyelashes', 90, 2000, null, 17],
  ];

  const seedTx = db.transaction(() => {
    services.forEach(s => insertService.run(...s));
  });

  seedTx();

  console.log(`✅ Seeded ${services.length} services`);
  console.log('✅ Database seeding completed');
  process.exit(0);
}

main().catch(e => {
  console.error('Seed failed:', e);
  process.exit(1);
});
